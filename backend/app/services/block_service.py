from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.block import Block
from app.models.user import User
from app.models.follow import Follow


class BlockService:
    @staticmethod
    def toggle_block(db: Session, current_user_id: UUID, target_user_id: UUID) -> dict:
        if current_user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself")
        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = (
            db.query(Block)
            .filter(Block.blocker_id == current_user_id, Block.blocked_id == target_user_id)
            .first()
        )
        if existing:
            db.delete(existing)
            db.commit()
            blocked = False
        else:
            block = Block(blocker_id=current_user_id, blocked_id=target_user_id)
            db.add(block)
            db.commit()
            blocked = True
            if blocked:
                follow = db.query(Follow).filter(
                    Follow.follower_id == current_user_id,
                    Follow.following_id == target_user_id,
                ).first()
                if follow:
                    db.delete(follow)
                    db.commit()

        return {"blocked": blocked}

    @staticmethod
    def is_blocked(db: Session, blocker_id: UUID, blocked_id: UUID) -> bool:
        return (
            db.query(Block)
            .filter(Block.blocker_id == blocker_id, Block.blocked_id == blocked_id)
            .first()
            is not None
        )

    @staticmethod
    def get_blocked_ids(db: Session, user_id: UUID) -> list:
        return [r[0] for r in db.query(Block.blocked_id).filter(Block.blocker_id == user_id).all()]
