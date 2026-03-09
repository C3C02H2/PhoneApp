from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Context (Yes details) ---

class CheckinContextCreate(BaseModel):
    goal_id: Optional[UUID] = None
    what_i_tried: Optional[str] = Field(None, max_length=500)
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    note: Optional[str] = Field(None, max_length=2000)
    next_step: Optional[str] = Field(None, max_length=500)
    mood: Optional[str] = Field(None, max_length=20)
    energy: Optional[int] = Field(None, ge=1, le=5)


class CheckinContextResponse(BaseModel):
    id: UUID
    goal_id: Optional[UUID]
    what_i_tried: Optional[str]
    duration_minutes: Optional[int]
    note: Optional[str]
    next_step: Optional[str]
    mood: Optional[str]
    energy: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Excuse (No details) ---

class ExcuseCreate(BaseModel):
    category: str = Field(..., max_length=50)
    detail: Optional[str] = Field(None, max_length=1000)


class ExcuseResponse(BaseModel):
    id: UUID
    category: str
    detail: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Check-in ---

class CheckinCreate(BaseModel):
    answer: bool = Field(..., description="Did you try today? true/false")
    context: Optional[CheckinContextCreate] = None
    excuse: Optional[ExcuseCreate] = None


class CheckinResponse(BaseModel):
    id: UUID
    user_id: UUID
    checkin_date: date
    answer: bool
    context: Optional[CheckinContextResponse] = None
    excuse: Optional[ExcuseResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StreakResponse(BaseModel):
    current_streak: int = Field(..., description="Consecutive yes-days")
    longest_streak: int = Field(0, description="All-time longest streak")
    total_checkins: int = Field(..., description="Total yes check-ins")
    total_no: int = Field(0, description="Total no check-ins")
    success_rate: float = Field(0.0, description="Yes/Total ratio (0-1)")
    checked_in_today: bool = Field(..., description="Has check-in today")


class CheckinListResponse(BaseModel):
    checkins: List[CheckinResponse]
    total: int
