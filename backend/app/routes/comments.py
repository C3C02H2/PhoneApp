from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentListResponse
from app.services.comment_service import CommentService

router = APIRouter()


@router.get("/{post_id}/comments", response_model=CommentListResponse)
async def get_comments(post_id: UUID, db: Session = Depends(get_db)):
    return CommentService.get_comments(db, post_id)


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CommentService.create_comment(db, post_id, comment_data, current_user)
