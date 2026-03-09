from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[UUID] = None
    is_anonymous: bool = False


class CommentAuthor(BaseModel):
    id: UUID
    username: str

    model_config = {"from_attributes": True}


class CommentResponse(BaseModel):
    id: UUID
    content: str
    post_id: UUID
    author: Optional[CommentAuthor] = None
    parent_id: Optional[UUID] = None
    is_anonymous: bool
    created_at: datetime
    replies: List["CommentResponse"] = []

    model_config = {"from_attributes": True}


class CommentListResponse(BaseModel):
    comments: List[CommentResponse]
    total: int
