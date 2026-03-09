from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ChatRequestCreate(BaseModel):
    receiver_id: UUID
    duration_minutes: int = Field(5, ge=5, le=30)


class ChatRequestResponse(BaseModel):
    id: UUID
    sender_id: UUID
    sender_username: str
    receiver_id: UUID
    receiver_username: str
    duration_minutes: int
    status: str
    created_at: datetime


class ChatRequestAction(BaseModel):
    action: str = Field(..., pattern="^(accept|decline)$")


class ChatSessionResponse(BaseModel):
    id: UUID
    user1_id: UUID
    user1_username: str
    user2_id: UUID
    user2_username: str
    duration_minutes: int
    started_at: datetime
    expires_at: datetime
    is_active: bool


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    sender_id: UUID
    sender_username: str
    content: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class ChatListResponse(BaseModel):
    requests: list[ChatRequestResponse]
    sessions: list[ChatSessionResponse]
