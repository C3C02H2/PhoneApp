import httpx
import logging
from sqlalchemy.orm import Session
from app.models.push_token import PushToken

logger = logging.getLogger(__name__)

class PushService:
    @staticmethod
    def save_token(db: Session, user_id, token: str):
        existing = db.query(PushToken).filter(PushToken.token == token).first()
        if existing:
            existing.user_id = user_id
            db.commit()
            return
        push_token = PushToken(user_id=user_id, token=token)
        db.add(push_token)
        db.commit()

    @staticmethod
    def remove_token(db: Session, token: str):
        db.query(PushToken).filter(PushToken.token == token).delete()
        db.commit()

    @staticmethod
    def get_tokens_for_users(db: Session, user_ids: list) -> list:
        from app.models.user import User
        return [
            r.token for r in db.query(PushToken)
            .join(User, PushToken.user_id == User.id)
            .filter(PushToken.user_id.in_(user_ids), User.notifications_enabled == True)
            .all()
        ]

    @staticmethod
    async def send_notifications(tokens: list, title: str, body: str, data: dict = None):
        if not tokens:
            return
        messages = [{"to": t, "sound": "default", "title": title, "body": body, "data": data or {}} for t in tokens]
        try:
            async with httpx.AsyncClient() as client:
                await client.post("https://exp.host/--/api/v2/push/send", json=messages, headers={"Content-Type": "application/json"})
        except Exception as e:
            logger.error(f"Push notification error: {e}")
