from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.checkin import (
    CheckinCreate,
    CheckinResponse,
    CheckinListResponse,
    StreakResponse,
)
from app.services.checkin_service import CheckinService

router = APIRouter()


@router.post("", response_model=CheckinResponse, status_code=201)
async def create_checkin(
    checkin_data: CheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Създава дневен check-in.

    Ако вече е направен check-in днес, обновява отговора.
    """
    return CheckinService.create_checkin(db, checkin_data, current_user)


@router.get("/me", response_model=CheckinListResponse)
async def get_my_checkins(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Връща check-ins на текущия потребител."""
    return CheckinService.get_my_checkins(db, current_user, skip=skip, limit=limit)


@router.get("/streak", response_model=StreakResponse)
async def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Връща текущия streak и статистики на потребителя."""
    return CheckinService.get_streak(db, current_user)

