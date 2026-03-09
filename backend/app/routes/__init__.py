from fastapi import APIRouter

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.posts import router as posts_router
from app.routes.checkins import router as checkins_router
from app.routes.comments import router as comments_router
from app.routes.goals import router as goals_router
from app.routes.stats import router as stats_router
from app.routes.weekly import router as weekly_router
from app.routes.chat import router as chat_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(posts_router, prefix="/posts", tags=["Posts"])
api_router.include_router(comments_router, prefix="/posts", tags=["Comments"])
api_router.include_router(checkins_router, prefix="/checkins", tags=["Check-ins"])
api_router.include_router(goals_router, prefix="/goals", tags=["Goals"])
api_router.include_router(stats_router, prefix="/stats", tags=["Stats"])
api_router.include_router(weekly_router, prefix="/weekly", tags=["Weekly"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
