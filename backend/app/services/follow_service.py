from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.follow import Follow
from app.models.user import User

class FollowService:
    @staticmethod
    def toggle_follow(db: Session, current_user_id: UUID, target_user_id: UUID) -> dict:
        if current_user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        existing = db.query(Follow).filter(Follow.follower_id == current_user_id, Follow.following_id == target_user_id).first()
        if existing:
            db.delete(existing)
            db.commit()
            following = False
        else:
            follow = Follow(follower_id=current_user_id, following_id=target_user_id)
            db.add(follow)
            db.commit()
            following = True
        followers_count = db.query(Follow).filter(Follow.following_id == target_user_id).count()
        following_count = db.query(Follow).filter(Follow.follower_id == target_user_id).count()
        return {"following": following, "followers_count": followers_count, "following_count": following_count}

    @staticmethod
    def is_following(db: Session, follower_id: UUID, following_id: UUID) -> bool:
        return db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first() is not None

    @staticmethod
    def get_counts(db: Session, user_id: UUID) -> dict:
        followers = db.query(Follow).filter(Follow.following_id == user_id).count()
        following = db.query(Follow).filter(Follow.follower_id == user_id).count()
        return {"followers_count": followers, "following_count": following}

    @staticmethod
    def get_following_ids(db: Session, user_id: UUID) -> list:
        return [r[0] for r in db.query(Follow.following_id).filter(Follow.follower_id == user_id).all()]
