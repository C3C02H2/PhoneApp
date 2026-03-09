from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class WeeklyTargetCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    target_count: int = Field(1, ge=1, le=999)


class WeeklyTargetUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    target_count: int | None = Field(None, ge=1, le=999)
    current_count: int | None = Field(None, ge=0)


class WeeklyTargetResponse(BaseModel):
    id: UUID
    title: str
    target_count: int
    current_count: int
    week_start: date
    created_at: str

    model_config = {"from_attributes": True}


class WeeklyTargetListResponse(BaseModel):
    targets: list[WeeklyTargetResponse]
    week_start: date
    week_end: date
