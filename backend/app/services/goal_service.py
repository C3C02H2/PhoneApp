from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, GoalListResponse


class GoalService:

    @staticmethod
    def create(db: Session, data: GoalCreate, user: User) -> GoalResponse:
        count = db.query(Goal).filter(Goal.user_id == user.id, Goal.is_active == True).count()
        if count >= 10:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Maximum 10 active goals")

        goal = Goal(
            user_id=user.id,
            title=data.title,
            description=data.description,
            color=data.color,
            sort_order=count,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return GoalResponse.model_validate(goal)

    @staticmethod
    def list(db: Session, user: User, active_only: bool = True) -> GoalListResponse:
        q = db.query(Goal).filter(Goal.user_id == user.id)
        if active_only:
            q = q.filter(Goal.is_active == True)
        goals = q.order_by(Goal.sort_order, Goal.created_at).all()
        return GoalListResponse(
            goals=[GoalResponse.model_validate(g) for g in goals],
            total=len(goals),
        )

    @staticmethod
    def update(db: Session, goal_id, data: GoalUpdate, user: User) -> GoalResponse:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
        if not goal:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(goal, field, value)

        db.commit()
        db.refresh(goal)
        return GoalResponse.model_validate(goal)

    @staticmethod
    def delete(db: Session, goal_id, user: User) -> dict:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
        if not goal:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
        db.delete(goal)
        db.commit()
        return {"deleted": True}
