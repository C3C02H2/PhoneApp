from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse, PostListResponse, PostAuthor


class PostService:
    @staticmethod
    def _post_to_response(
        post: Post,
        likes_count: int = 0,
        comments_count: int = 0,
        is_liked: bool = False,
    ) -> PostResponse:
        author = None
        author_id = None
        if post.is_anonymous:
            author = PostAuthor(id="00000000-0000-0000-0000-000000000000", username="Anonymous")
        elif post.author:
            author = PostAuthor(id=post.author.id, username=post.author.username)
            author_id = post.author_id

        return PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            author_id=author_id,
            author=author,
            is_anonymous=post.is_anonymous,
            category=getattr(post, 'category', None),
            prompt=getattr(post, 'prompt', None),
            likes_count=likes_count,
            comments_count=comments_count,
            views_count=getattr(post, 'views_count', 0) or 0,
            is_liked=is_liked,
            created_at=post.created_at,
            updated_at=post.updated_at,
        )

    @staticmethod
    def _get_post_stats(db: Session, post_ids: list, current_user_id: Optional[UUID] = None):
        likes_counts = dict(
            db.query(Like.post_id, func.count(Like.id))
            .filter(Like.post_id.in_(post_ids))
            .group_by(Like.post_id)
            .all()
        )
        comments_counts = dict(
            db.query(Comment.post_id, func.count(Comment.id))
            .filter(Comment.post_id.in_(post_ids))
            .group_by(Comment.post_id)
            .all()
        )
        user_likes = set()
        if current_user_id:
            user_likes = set(
                row[0]
                for row in db.query(Like.post_id)
                .filter(Like.post_id.in_(post_ids), Like.user_id == current_user_id)
                .all()
            )
        return likes_counts, comments_counts, user_likes

    @staticmethod
    def get_all_posts(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "recent",
        current_user_id: Optional[UUID] = None,
        following_ids: Optional[list] = None,
        exclude_author_ids: Optional[list] = None,
        category: Optional[str] = None,
    ) -> PostListResponse:
        query = db.query(Post).options(joinedload(Post.author))

        if category:
            query = query.filter(Post.category == category)
        if sort_by == "following" and following_ids is not None:
            query = query.filter(Post.author_id.in_(following_ids))
        if exclude_author_ids:
            query = query.filter(~Post.author_id.in_(exclude_author_ids))

        total = query.count()

        if sort_by == "most_liked":
            like_count_sub = (
                db.query(Like.post_id, func.count(Like.id).label("lc"))
                .group_by(Like.post_id)
                .subquery()
            )
            query = (
                query.outerjoin(like_count_sub, Post.id == like_count_sub.c.post_id)
                .order_by(func.coalesce(like_count_sub.c.lc, 0).desc(), Post.created_at.desc())
            )
        elif sort_by == "most_commented":
            comment_count_sub = (
                db.query(Comment.post_id, func.count(Comment.id).label("cc"))
                .group_by(Comment.post_id)
                .subquery()
            )
            query = (
                query.outerjoin(comment_count_sub, Post.id == comment_count_sub.c.post_id)
                .order_by(func.coalesce(comment_count_sub.c.cc, 0).desc(), Post.created_at.desc())
            )
        else:
            query = query.order_by(Post.created_at.desc())

        posts = query.offset(skip).limit(limit).all()
        post_ids = [p.id for p in posts]

        likes_counts, comments_counts, user_likes = PostService._get_post_stats(
            db, post_ids, current_user_id
        )

        return PostListResponse(
            posts=[
                PostService._post_to_response(
                    post,
                    likes_count=likes_counts.get(post.id, 0),
                    comments_count=comments_counts.get(post.id, 0),
                    is_liked=post.id in user_likes,
                )
                for post in posts
            ],
            total=total,
        )

    @staticmethod
    def get_post_by_id(
        db: Session,
        post_id: UUID,
        current_user_id: Optional[UUID] = None,
    ) -> PostResponse:
        post = (
            db.query(Post)
            .options(joinedload(Post.author))
            .filter(Post.id == post_id)
            .first()
        )

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        post.views_count = (post.views_count or 0) + 1
        db.commit()
        db.refresh(post)

        likes_count = db.query(Like).filter(Like.post_id == post_id).count()
        comments_count = db.query(Comment).filter(Comment.post_id == post_id).count()
        is_liked = False
        if current_user_id:
            like_exists = (
                db.query(Like)
                .filter(Like.post_id == post_id, Like.user_id == current_user_id)
                .first()
            )
            is_liked = like_exists is not None

        return PostService._post_to_response(post, likes_count, comments_count, is_liked)

    @staticmethod
    def create_post(
        db: Session, post_data: PostCreate, author: User
    ) -> PostResponse:
        post = Post(
            title=post_data.title,
            content=post_data.content,
            author_id=author.id,
            is_anonymous=post_data.is_anonymous,
            category=post_data.category,
            prompt=post_data.prompt,
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        post = (
            db.query(Post)
            .options(joinedload(Post.author))
            .filter(Post.id == post.id)
            .first()
        )

        return PostService._post_to_response(post)

    @staticmethod
    def toggle_like(db: Session, post_id: UUID, user: User) -> dict:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        existing = (
            db.query(Like)
            .filter(Like.post_id == post_id, Like.user_id == user.id)
            .first()
        )

        if existing:
            db.delete(existing)
            db.commit()
            liked = False
        else:
            like = Like(post_id=post_id, user_id=user.id)
            db.add(like)
            db.commit()
            liked = True

        likes_count = db.query(Like).filter(Like.post_id == post_id).count()
        return {"liked": liked, "likes_count": likes_count}

    @staticmethod
    def delete_post(db: Session, post_id: UUID, user: User):
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        if post.author_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your post")
        db.delete(post)
        db.commit()
