from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: str = Field("#8B5CF6", max_length=7)


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=7)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class GoalResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    color: str
    is_active: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class GoalListResponse(BaseModel):
    goals: list[GoalResponse]
    total: int
