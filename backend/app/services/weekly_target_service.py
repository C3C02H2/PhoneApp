from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.weekly_target import WeeklyTarget


def _monday_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


class WeeklyTargetService:
    MAX_TARGETS_PER_WEEK = 5

    @staticmethod
    def list_for_week(db: Session, user_id: UUID, week_start: date | None = None) -> dict:
        if week_start is None:
            week_start = _monday_of_week(date.today())
        week_end = week_start + timedelta(days=6)

        targets = (
            db.query(WeeklyTarget)
            .filter(
                WeeklyTarget.user_id == user_id,
                WeeklyTarget.week_start == week_start,
            )
            .order_by(WeeklyTarget.created_at)
            .all()
        )

        return {
            "targets": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "target_count": t.target_count,
                    "current_count": t.current_count,
                    "week_start": t.week_start.isoformat(),
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
                for t in targets
            ],
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
        }

    @staticmethod
    def create(db: Session, user_id: UUID, title: str, target_count: int = 1) -> dict:
        week_start = _monday_of_week(date.today())
        count = db.query(WeeklyTarget).filter(
            WeeklyTarget.user_id == user_id,
            WeeklyTarget.week_start == week_start,
        ).count()
        if count >= WeeklyTargetService.MAX_TARGETS_PER_WEEK:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {WeeklyTargetService.MAX_TARGETS_PER_WEEK} targets per week",
            )

        existing = db.query(WeeklyTarget).filter(
            WeeklyTarget.user_id == user_id,
            WeeklyTarget.week_start == week_start,
            WeeklyTarget.title == title.strip(),
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target with this title already exists for this week",
            )

        t = WeeklyTarget(
            user_id=user_id,
            title=title.strip(),
            target_count=target_count,
            current_count=0,
            week_start=week_start,
        )
        db.add(t)
        db.commit()
        db.refresh(t)

        return {
            "id": str(t.id),
            "title": t.title,
            "target_count": t.target_count,
            "current_count": t.current_count,
            "week_start": t.week_start.isoformat(),
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }

    @staticmethod
    def update(db: Session, target_id: UUID, user_id: UUID, **kwargs) -> dict:
        t = db.query(WeeklyTarget).filter(
            WeeklyTarget.id == target_id,
            WeeklyTarget.user_id == user_id,
        ).first()
        if not t:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found")

        if "title" in kwargs and kwargs["title"] is not None:
            t.title = kwargs["title"].strip()
        if "target_count" in kwargs and kwargs["target_count"] is not None:
            t.target_count = kwargs["target_count"]
        if "current_count" in kwargs and kwargs["current_count"] is not None:
            t.current_count = kwargs["current_count"]

        db.commit()
        db.refresh(t)

        return {
            "id": str(t.id),
            "title": t.title,
            "target_count": t.target_count,
            "current_count": t.current_count,
            "week_start": t.week_start.isoformat(),
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }

    @staticmethod
    def delete(db: Session, target_id: UUID, user_id: UUID) -> None:
        t = db.query(WeeklyTarget).filter(
            WeeklyTarget.id == target_id,
            WeeklyTarget.user_id == user_id,
        ).first()
        if not t:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found")
        db.delete(t)
        db.commit()
