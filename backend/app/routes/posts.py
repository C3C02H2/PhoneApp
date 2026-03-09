from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.like import LikeResponse
from app.schemas.post import PostCreate, PostResponse, PostListResponse
from app.services.post_service import PostService
from app.services.follow_service import FollowService
from app.services.push_service import PushService
from app.services.block_service import BlockService

router = APIRouter()
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()

@router.get("", response_model=PostListResponse)
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("recent", regex="^(recent|most_liked|most_commented|following)$"),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    following_ids = None
    exclude_author_ids = None
    if current_user:
        if sort_by == "following":
            following_ids = FollowService.get_following_ids(db, current_user.id)
        exclude_author_ids = BlockService.get_blocked_ids(db, current_user.id)
    return PostService.get_all_posts(
        db, skip=skip, limit=limit, sort_by=sort_by,
        current_user_id=current_user.id if current_user else None,
        following_ids=following_ids,
        exclude_author_ids=exclude_author_ids,
        category=category,
    )

@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = PostService.create_post(db, post_data, current_user)
    if not post_data.is_anonymous:
        from app.models.follow import Follow
        follower_ids = [r[0] for r in db.query(Follow.follower_id).filter(Follow.following_id == current_user.id).all()]
        if follower_ids:
            enabled_follower_ids = [
                uid for uid, in db.query(User.id).filter(
                    User.id.in_(follower_ids),
                    User.notifications_enabled == True,
                ).all()
            ]
            if enabled_follower_ids:
                tokens = PushService.get_tokens_for_users(db, enabled_follower_ids)
                await PushService.send_notifications(
                    tokens,
                    f"{current_user.username} posted",
                    post_data.title,
                    {"postId": str(result.id)},
                )
    return result

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    return PostService.get_post_by_id(db, post_id, current_user_id=current_user.id if current_user else None)

@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    PostService.delete_post(db, post_id, current_user)

@router.post("/{post_id}/like", response_model=LikeResponse)
async def toggle_like(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PostService.toggle_like(db, post_id, current_user)
