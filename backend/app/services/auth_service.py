import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.email_service import EmailService


class AuthService:
    """Service за authentication операции."""

    @staticmethod
    def register(db: Session, user_data: UserCreate) -> Token:
        """Регистрира нов потребител."""
        # Проверка за съществуващ email
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Проверка за съществуващ username
        existing_username = (
            db.query(User).filter(User.username == user_data.username).first()
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

        # Създаване на потребител
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Генериране на token
        access_token = create_access_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def login(db: Session, login_data: UserLogin) -> Token:
        """Автентикира потребител и връща token."""
        user = db.query(User).filter(User.email == login_data.email).first()

        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive account",
            )

        access_token = create_access_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def forgot_password(db: Session, data: ForgotPasswordRequest) -> dict:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            return {"message": "If the email exists, a reset code has been sent."}

        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id
        ).delete()

        code = str(random.randint(100000, 999999))
        reset_token = PasswordResetToken(
            user_id=user.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        db.add(reset_token)
        db.commit()

        EmailService.send_reset_code(data.email, code)

        return {"message": "If the email exists, a reset code has been sent."}

    @staticmethod
    def reset_password(db: Session, data: ResetPasswordRequest) -> dict:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or code",
            )

        reset_token = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.code == data.code,
            )
            .first()
        )

        if not reset_token or reset_token.is_expired:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired code",
            )

        user.hashed_password = hash_password(data.new_password)
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id
        ).delete()
        db.commit()

        return {"message": "Password has been reset successfully."}

