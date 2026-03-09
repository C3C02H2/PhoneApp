from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=Token, status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрация на нов потребител.

    - **username**: уникален username (3-50 символа)
    - **email**: валиден email адрес
    - **password**: парола (минимум 6 символа)
    """
    return AuthService.register(db, user_data)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Вход в системата.

    - **email**: email адрес
    - **password**: парола
    """
    return AuthService.login(db, login_data)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.forgot_password(db, data)


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.reset_password(db, data)

