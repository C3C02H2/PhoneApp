from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentListResponse, CommentAuthor


class CommentService:
    @staticmethod
    def _build_response(comment: Comment) -> CommentResponse:
        author = None
        if not comment.is_anonymous and comment.author:
            author = CommentAuthor(
                id=comment.author.id,
                username=comment.author.username,
            )

        replies = [CommentService._build_response(r) for r in comment.replies]

        return CommentResponse(
            id=comment.id,
            content=comment.content,
            post_id=comment.post_id,
            author=author,
            parent_id=comment.parent_id,
            is_anonymous=comment.is_anonymous,
            created_at=comment.created_at,
            replies=replies,
        )

    @staticmethod
    def get_comments(db: Session, post_id: UUID) -> CommentListResponse:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        top_level = (
            db.query(Comment)
            .options(
                joinedload(Comment.author),
                joinedload(Comment.replies).joinedload(Comment.author),
            )
            .filter(Comment.post_id == post_id, Comment.parent_id.is_(None))
            .order_by(Comment.created_at.asc())
            .all()
        )

        total = db.query(Comment).filter(Comment.post_id == post_id).count()

        return CommentListResponse(
            comments=[CommentService._build_response(c) for c in top_level],
            total=total,
        )

    @staticmethod
    def create_comment(
        db: Session,
        post_id: UUID,
        comment_data: CommentCreate,
        author: User,
    ) -> CommentResponse:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        if comment_data.parent_id:
            parent = (
                db.query(Comment)
                .filter(
                    Comment.id == comment_data.parent_id,
                    Comment.post_id == post_id,
                )
                .first()
            )
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found",
                )

        comment = Comment(
            content=comment_data.content,
            post_id=post_id,
            author_id=author.id,
            parent_id=comment_data.parent_id,
            is_anonymous=comment_data.is_anonymous,
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)

        comment = (
            db.query(Comment)
            .options(joinedload(Comment.author), joinedload(Comment.replies))
            .filter(Comment.id == comment.id)
            .first()
        )

        return CommentService._build_response(comment)
