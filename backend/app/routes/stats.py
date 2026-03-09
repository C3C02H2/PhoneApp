from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, extract
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.checkin import DailyCheckin
from app.models.excuse import Excuse
from app.models.checkin_context import CheckinContext
from app.models.user import User
from app.services.achievement_service import AchievementService

router = APIRouter()


@router.get("/calendar")
async def get_calendar(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns check-in data for a given month: {date: answer}."""
    checkins = (
        db.query(DailyCheckin.checkin_date, DailyCheckin.answer)
        .filter(
            DailyCheckin.user_id == current_user.id,
            extract("year", DailyCheckin.checkin_date) == year,
            extract("month", DailyCheckin.checkin_date) == month,
        )
        .all()
    )
    return {
        "year": year,
        "month": month,
        "days": {str(c.checkin_date): c.answer for c in checkins},
    }


@router.get("/dashboard")
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated stats for the dashboard."""
    from datetime import date, timedelta
    from app.services.checkin_service import CheckinService

    streak_data = CheckinService.get_streak(db, current_user)

    today = date.today()
    days_7 = today - timedelta(days=6)
    days_30 = today - timedelta(days=29)

    yes_7 = (
        db.query(DailyCheckin)
        .filter(and_(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.answer == True,
            DailyCheckin.checkin_date >= days_7,
        ))
        .count()
    )
    yes_30 = (
        db.query(DailyCheckin)
        .filter(and_(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.answer == True,
            DailyCheckin.checkin_date >= days_30,
        ))
        .count()
    )

    top_excuses = (
        db.query(Excuse.category, func.count(Excuse.id).label("cnt"))
        .join(DailyCheckin, Excuse.checkin_id == DailyCheckin.id)
        .filter(DailyCheckin.user_id == current_user.id)
        .group_by(Excuse.category)
        .order_by(func.count(Excuse.id).desc())
        .limit(5)
        .all()
    )

    mood_counts = (
        db.query(CheckinContext.mood, func.count(CheckinContext.id).label("cnt"))
        .join(DailyCheckin, CheckinContext.checkin_id == DailyCheckin.id)
        .filter(DailyCheckin.user_id == current_user.id, CheckinContext.mood.isnot(None))
        .group_by(CheckinContext.mood)
        .all()
    )

    return {
        **streak_data.model_dump(),
        "consistency_7d": yes_7,
        "consistency_30d": yes_30,
        "top_excuses": [{"category": e[0], "count": e[1]} for e in top_excuses],
        "mood_distribution": {m[0]: m[1] for m in mood_counts},
    }


@router.get("/achievements")
async def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    AchievementService.check_and_award(db, current_user.id)
    return {"achievements": AchievementService.get_user_achievements(db, current_user.id)}
