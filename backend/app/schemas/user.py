from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema за регистрация на нов потребител."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Username (3-50 символа)",
    )
    email: EmailStr = Field(..., description="Email адрес")
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Парола (минимум 6 символа)",
    )


class UserLogin(BaseModel):
    """Schema за login."""

    email: EmailStr = Field(..., description="Email адрес")
    password: str = Field(..., description="Парола")


class UserResponse(BaseModel):
    """Schema за отговор с потребителски данни."""

    id: UUID
    username: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema за JWT token отговор."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=128)


class UserProfileResponse(BaseModel):
    id: UUID
    username: str
    is_active: bool
    is_private: bool = False
    created_at: datetime
    posts_count: int = 0
    total_likes_received: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    is_blocked: bool = False
    current_streak: int = 0
    longest_streak: int = 0
    total_checkins: int = 0
    success_rate: float = 0.0
    comments_count: int = 0

    model_config = {"from_attributes": True}


class UpdateUsernameRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class UpdateEmailRequest(BaseModel):
    email: EmailStr

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)

class UpdateSettingsRequest(BaseModel):
    is_private: bool | None = None
    notifications_enabled: bool | None = None
    daily_reminder_enabled: bool | None = None
    daily_reminder_time: str | None = None
    evening_reminder_enabled: bool | None = None
    evening_reminder_time: str | None = None
    default_anonymous: bool | None = None
    weekly_summary_enabled: bool | None = None

class UserSettingsResponse(BaseModel):
    is_private: bool = False
    notifications_enabled: bool = True
    daily_reminder_enabled: bool = True
    daily_reminder_time: str = "08:00"
    evening_reminder_enabled: bool = False
    evening_reminder_time: str = "21:00"
    default_anonymous: bool = False
    weekly_summary_enabled: bool = True
    model_config = {"from_attributes": True}


class UserSearchResult(BaseModel):
    id: UUID
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSearchResponse(BaseModel):
    users: list[UserSearchResult]
    total: int

