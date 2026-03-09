from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


COMMUNITY_CATEGORIES = [
    "general", "builders", "fitness", "study", "discipline", "creators",
]


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    is_anonymous: bool = False
    category: Optional[str] = Field(None, max_length=50)
    prompt: Optional[str] = Field(None, max_length=200)


class PostAuthor(BaseModel):
    """Schema за автор на пост (вложен обект)."""

    id: UUID
    username: str

    model_config = {"from_attributes": True}


class PostResponse(BaseModel):
    """Schema за отговор с данни за пост."""

    id: UUID
    title: str
    content: str
    author_id: Optional[UUID] = None
    author: Optional[PostAuthor] = None
    is_anonymous: bool = False
    category: Optional[str] = None
    prompt: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    is_liked: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    """Schema за списък с постове."""

    posts: List[PostResponse]
    total: int

