from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.weekly_target import WeeklyTargetCreate, WeeklyTargetUpdate
from app.services.weekly_target_service import WeeklyTargetService

router = APIRouter()


@router.get("")
async def list_targets(
    week_start: date | None = Query(None, description="Monday of week (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WeeklyTargetService.list_for_week(db, current_user.id, week_start)


@router.post("", status_code=201)
async def create_target(
    data: WeeklyTargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WeeklyTargetService.create(
        db, current_user.id, data.title, data.target_count
    )


@router.patch("/{target_id}")
async def update_target(
    target_id: UUID,
    data: WeeklyTargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WeeklyTargetService.update(
        db, target_id, current_user.id,
        **data.model_dump(exclude_none=True),
    )


@router.delete("/{target_id}")
async def delete_target(
    target_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    WeeklyTargetService.delete(db, target_id, current_user.id)
    return {"status": "ok"}
