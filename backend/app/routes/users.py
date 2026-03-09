from uuid import UUID
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserResponse, UserProfileResponse, UserSearchResponse,
    UpdateUsernameRequest, UpdateEmailRequest, ChangePasswordRequest,
    UpdateSettingsRequest, UserSettingsResponse,
)
from app.services.user_service import UserService
from app.services.follow_service import FollowService
from app.services.push_service import PushService
from app.services.block_service import BlockService

router = APIRouter()

class PushTokenRequest(BaseModel):
    token: str

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserService.get_profile(current_user)

@router.patch("/me/username", response_model=UserResponse)
async def update_username(
    data: UpdateUsernameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.update_username(db, current_user, data.username)

@router.patch("/me/email", response_model=UserResponse)
async def update_email(
    data: UpdateEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.update_email(db, current_user, data.email)

@router.patch("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.change_password(db, current_user, data.current_password, data.new_password)

@router.get("/me/settings", response_model=UserSettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    return UserService.get_settings(current_user)

@router.patch("/me/settings", response_model=UserSettingsResponse)
async def update_settings(
    data: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.update_settings(
        db, current_user,
        **data.model_dump(exclude_none=True),
    )

@router.delete("/me")
async def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.delete_account(db, current_user)

@router.get("/me/stats", response_model=UserProfileResponse)
async def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = UserService.get_user_stats(db, current_user.id)
    follow_counts = FollowService.get_counts(db, current_user.id)
    return {**stats.model_dump(), **follow_counts}

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=1, max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.search_users(db, q, skip=skip, limit=limit, exclude_ids=BlockService.get_blocked_ids(db, current_user.id))

@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if BlockService.is_blocked(db, user_id, current_user.id):
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    stats = UserService.get_user_stats(db, user_id)
    follow_counts = FollowService.get_counts(db, user_id)
    is_following = FollowService.is_following(db, current_user.id, user_id)
    is_blocked = BlockService.is_blocked(db, current_user.id, user_id)
    return {**stats.model_dump(), **follow_counts, "is_following": is_following, "is_blocked": is_blocked}

@router.post("/{user_id}/block")
async def toggle_block(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BlockService.toggle_block(db, current_user.id, user_id)

@router.post("/{user_id}/follow")
async def toggle_follow(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return FollowService.toggle_follow(db, current_user.id, user_id)

@router.get("/me/blocked", response_model=UserSearchResponse)
async def get_blocked_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocked_ids = BlockService.get_blocked_ids(db, current_user.id)
    if not blocked_ids:
        return UserSearchResponse(users=[], total=0)
    from app.schemas.user import UserSearchResult
    users = db.query(User).filter(User.id.in_(blocked_ids), User.is_active == True).all()
    return UserSearchResponse(
        users=[UserSearchResult(id=u.id, username=u.username, created_at=u.created_at) for u in users],
        total=len(users),
    )

@router.post("/push-token")
async def save_push_token(
    data: PushTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    PushService.save_token(db, current_user.id, data.token)
    return {"status": "ok"}

@router.delete("/push-token")
async def remove_push_token(
    data: PushTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    PushService.remove_token(db, data.token)
    return {"status": "ok"}
