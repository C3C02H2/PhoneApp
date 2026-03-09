from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.checkin import DailyCheckin
from app.models.checkin_context import CheckinContext
from app.models.excuse import Excuse
from app.models.user import User
from app.services.checkin_service import CheckinService

router = APIRouter()


@router.get("/summary")
async def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    week_start = today - timedelta(days=6)

    week_checkins = (
        db.query(DailyCheckin)
        .filter(and_(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.checkin_date >= week_start,
            DailyCheckin.checkin_date <= today,
        ))
        .all()
    )

    yes_days = sum(1 for c in week_checkins if c.answer)
    no_days = sum(1 for c in week_checkins if not c.answer)
    missed_days = 7 - len(week_checkins)

    streak = CheckinService.get_streak(db, current_user)

    checkin_ids = [c.id for c in week_checkins if c.answer]
    notes = []
    if checkin_ids:
        contexts = (
            db.query(CheckinContext)
            .filter(CheckinContext.checkin_id.in_(checkin_ids))
            .all()
        )
        notes = [c.note for c in contexts if c.note]

    no_checkin_ids = [c.id for c in week_checkins if not c.answer]
    top_excuses = []
    if no_checkin_ids:
        excuses = (
            db.query(Excuse.category, func.count(Excuse.id))
            .filter(Excuse.checkin_id.in_(no_checkin_ids))
            .group_by(Excuse.category)
            .order_by(func.count(Excuse.id).desc())
            .all()
        )
        top_excuses = [{"category": e[0], "count": e[1]} for e in excuses]

    mood_data = {}
    if checkin_ids:
        moods = (
            db.query(CheckinContext.mood, func.count(CheckinContext.id))
            .filter(
                CheckinContext.checkin_id.in_(checkin_ids),
                CheckinContext.mood.isnot(None),
            )
            .group_by(CheckinContext.mood)
            .all()
        )
        mood_data = {m[0]: m[1] for m in moods}

    if yes_days >= 6:
        insight = "Outstanding week. You showed up almost every day. Keep this momentum."
    elif yes_days >= 4:
        insight = "Solid week. More than half the days, you tried. Build on this."
    elif yes_days >= 2:
        insight = "A start. But you can do better. What held you back?"
    elif yes_days >= 1:
        insight = "One day is better than zero. But one day is not enough."
    else:
        insight = "You didn't try this week. Only you can change that."

    return {
        "week_start": str(week_start),
        "week_end": str(today),
        "yes_days": yes_days,
        "no_days": no_days,
        "missed_days": missed_days,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_checkins": streak.total_checkins,
        "top_excuses": top_excuses,
        "mood_trends": mood_data,
        "notes_count": len(notes),
        "insight": insight,
    }
