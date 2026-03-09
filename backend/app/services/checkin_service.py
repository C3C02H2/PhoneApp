from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload

from app.models.checkin import DailyCheckin
from app.models.checkin_context import CheckinContext
from app.models.excuse import Excuse
from app.models.user import User
from app.schemas.checkin import (
    CheckinCreate,
    CheckinResponse,
    CheckinListResponse,
    StreakResponse,
)
from app.services.achievement_service import AchievementService


class CheckinService:

    @staticmethod
    def create_checkin(
        db: Session, checkin_data: CheckinCreate, user: User
    ) -> CheckinResponse:
        today = date.today()

        existing = (
            db.query(DailyCheckin)
            .options(joinedload(DailyCheckin.context), joinedload(DailyCheckin.excuse))
            .filter(and_(DailyCheckin.user_id == user.id, DailyCheckin.checkin_date == today))
            .first()
        )

        if existing:
            existing.answer = checkin_data.answer

            if existing.context:
                db.delete(existing.context)
            if existing.excuse:
                db.delete(existing.excuse)
            db.flush()

            if checkin_data.answer and checkin_data.context:
                ctx = CheckinContext(
                    checkin_id=existing.id,
                    **checkin_data.context.model_dump(),
                )
                db.add(ctx)

            if not checkin_data.answer and checkin_data.excuse:
                exc = Excuse(
                    checkin_id=existing.id,
                    **checkin_data.excuse.model_dump(),
                )
                db.add(exc)

            db.commit()
            db.refresh(existing)
            return CheckinResponse.model_validate(existing)

        checkin = DailyCheckin(
            user_id=user.id,
            checkin_date=today,
            answer=checkin_data.answer,
        )
        db.add(checkin)
        db.flush()

        if checkin_data.answer and checkin_data.context:
            ctx = CheckinContext(
                checkin_id=checkin.id,
                **checkin_data.context.model_dump(),
            )
            db.add(ctx)

        if not checkin_data.answer and checkin_data.excuse:
            exc = Excuse(
                checkin_id=checkin.id,
                **checkin_data.excuse.model_dump(),
            )
            db.add(exc)

        db.commit()
        db.refresh(checkin)
        AchievementService.check_and_award(db, user.id)
        return CheckinResponse.model_validate(checkin)

    @staticmethod
    def get_my_checkins(
        db: Session, user: User, skip: int = 0, limit: int = 30
    ) -> CheckinListResponse:
        total = db.query(DailyCheckin).filter(DailyCheckin.user_id == user.id).count()
        checkins = (
            db.query(DailyCheckin)
            .options(joinedload(DailyCheckin.context), joinedload(DailyCheckin.excuse))
            .filter(DailyCheckin.user_id == user.id)
            .order_by(DailyCheckin.checkin_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return CheckinListResponse(
            checkins=[CheckinResponse.model_validate(c) for c in checkins],
            total=total,
        )

    @staticmethod
    def get_streak(db: Session, user: User) -> StreakResponse:
        today = date.today()

        total_yes = (
            db.query(DailyCheckin)
            .filter(and_(DailyCheckin.user_id == user.id, DailyCheckin.answer == True))
            .count()
        )
        total_no = (
            db.query(DailyCheckin)
            .filter(and_(DailyCheckin.user_id == user.id, DailyCheckin.answer == False))
            .count()
        )
        total_all = total_yes + total_no
        success_rate = round(total_yes / total_all, 2) if total_all > 0 else 0.0

        today_checkin = (
            db.query(DailyCheckin)
            .filter(and_(
                DailyCheckin.user_id == user.id,
                DailyCheckin.checkin_date == today,
                DailyCheckin.answer == True,
            ))
            .first()
        )
        checked_in_today = today_checkin is not None

        positive_dates = (
            db.query(DailyCheckin.checkin_date)
            .filter(and_(DailyCheckin.user_id == user.id, DailyCheckin.answer == True))
            .order_by(DailyCheckin.checkin_date.desc())
            .all()
        )
        dates_set = {d[0] for d in positive_dates}

        current_streak = CheckinService._calc_streak(dates_set, today)
        if current_streak == 0 and not checked_in_today:
            current_streak = CheckinService._calc_streak(dates_set, today - timedelta(days=1))

        longest_streak = CheckinService._calc_longest(dates_set)

        return StreakResponse(
            current_streak=current_streak,
            longest_streak=longest_streak,
            total_checkins=total_yes,
            total_no=total_no,
            success_rate=success_rate,
            checked_in_today=checked_in_today,
        )

    @staticmethod
    def _calc_streak(dates_set: set, start: date) -> int:
        streak = 0
        d = start
        while d in dates_set:
            streak += 1
            d -= timedelta(days=1)
        return streak

    @staticmethod
    def _calc_longest(dates_set: set) -> int:
        if not dates_set:
            return 0
        sorted_dates = sorted(dates_set)
        longest = 1
        current = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
                current += 1
                longest = max(longest, current)
            else:
                current = 1
        return longest
