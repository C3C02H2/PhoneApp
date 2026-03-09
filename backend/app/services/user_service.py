from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.checkin import DailyCheckin
from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.schemas.user import (
    UserResponse,
    UserProfileResponse,
    UserSearchResult,
    UserSearchResponse,
    UserSettingsResponse,
)


class UserService:

    @staticmethod
    def get_profile(user: User) -> UserResponse:
        return UserResponse.model_validate(user)

    @staticmethod
    def get_user_stats(db: Session, user_id: UUID) -> UserProfileResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        posts_count = db.query(Post).filter(Post.author_id == user_id).count()
        comments_count = db.query(Comment).filter(Comment.author_id == user_id).count()

        total_likes = (
            db.query(func.count(Like.id))
            .join(Post, Like.post_id == Post.id)
            .filter(Post.author_id == user_id)
            .scalar()
        ) or 0

        total_yes = (
            db.query(DailyCheckin)
            .filter(and_(DailyCheckin.user_id == user_id, DailyCheckin.answer == True))
            .count()
        )
        total_no = (
            db.query(DailyCheckin)
            .filter(and_(DailyCheckin.user_id == user_id, DailyCheckin.answer == False))
            .count()
        )
        total_all = total_yes + total_no
        success_rate = round(total_yes / total_all, 2) if total_all > 0 else 0.0

        positive_dates = {
            d[0]
            for d in db.query(DailyCheckin.checkin_date)
            .filter(and_(DailyCheckin.user_id == user_id, DailyCheckin.answer == True))
            .all()
        }

        today = date.today()
        current_streak = 0
        d = today
        while d in positive_dates:
            current_streak += 1
            d -= timedelta(days=1)
        if current_streak == 0 and today not in positive_dates:
            d = today - timedelta(days=1)
            while d in positive_dates:
                current_streak += 1
                d -= timedelta(days=1)

        longest_streak = 0
        if positive_dates:
            sorted_dates = sorted(positive_dates)
            current = 1
            for i in range(1, len(sorted_dates)):
                if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
                    current += 1
                    longest_streak = max(longest_streak, current)
                else:
                    current = 1
            longest_streak = max(longest_streak, current)

        return UserProfileResponse(
            id=user.id,
            username=user.username,
            is_active=user.is_active,
            created_at=user.created_at,
            posts_count=posts_count,
            comments_count=comments_count,
            total_likes_received=total_likes,
            current_streak=current_streak,
            longest_streak=longest_streak,
            total_checkins=total_yes,
            success_rate=success_rate,
        )

    @staticmethod
    def update_username(db: Session, user: User, new_username: str) -> UserResponse:
        existing = db.query(User).filter(User.username == new_username, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        user.username = new_username
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)

    @staticmethod
    def update_email(db: Session, user: User, new_email: str) -> UserResponse:
        existing = db.query(User).filter(User.email == new_email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user.email = new_email
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str) -> dict:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        user.hashed_password = hash_password(new_password)
        db.commit()
        return {"message": "Password changed successfully"}

    @staticmethod
    def get_settings(user: User) -> UserSettingsResponse:
        return UserSettingsResponse(
            is_private=getattr(user, 'is_private', False),
            notifications_enabled=getattr(user, 'notifications_enabled', True),
            daily_reminder_enabled=getattr(user, 'daily_reminder_enabled', True),
            daily_reminder_time=getattr(user, 'daily_reminder_time', '08:00'),
            evening_reminder_enabled=getattr(user, 'evening_reminder_enabled', False),
            evening_reminder_time=getattr(user, 'evening_reminder_time', '21:00'),
            default_anonymous=getattr(user, 'default_anonymous', False),
            weekly_summary_enabled=getattr(user, 'weekly_summary_enabled', True),
        )

    @staticmethod
    def update_settings(db: Session, user: User, **kwargs) -> UserSettingsResponse:
        settable = [
            'is_private', 'notifications_enabled', 'daily_reminder_enabled',
            'daily_reminder_time', 'evening_reminder_enabled', 'evening_reminder_time',
            'default_anonymous', 'weekly_summary_enabled',
        ]
        for key in settable:
            val = kwargs.get(key)
            if val is not None:
                setattr(user, key, val)
        db.commit()
        db.refresh(user)
        return UserService.get_settings(user)

    @staticmethod
    def delete_account(db: Session, user: User) -> dict:
        db.delete(user)
        db.commit()
        return {"message": "Account deleted"}

    @staticmethod
    def search_users(db: Session, query: str, skip: int = 0, limit: int = 20, exclude_ids: Optional[list] = None) -> UserSearchResponse:
        q = db.query(User).filter(
            User.username.ilike(f"%{query}%"),
            User.is_active == True,
        )
        if exclude_ids:
            q = q.filter(~User.id.in_(exclude_ids))
        total = q.count()
        users = q.order_by(User.username).offset(skip).limit(limit).all()
        return UserSearchResponse(
            users=[UserSearchResult(id=u.id, username=u.username, created_at=u.created_at) for u in users],
            total=total,
        )
