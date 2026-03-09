from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import (
    ChatRequestResponse,
    ChatSessionResponse,
    ChatMessageResponse,
    ChatListResponse,
)


class ChatService:

    @staticmethod
    def create_request(db: Session, sender_id: UUID, receiver_id: UUID, duration_minutes: int) -> ChatRequestResponse:
        if sender_id == receiver_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot chat with yourself")

        receiver = db.query(User).filter(User.id == receiver_id, User.is_active == True).first()
        if not receiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = db.query(ChatRequest).filter(
            ChatRequest.sender_id == sender_id,
            ChatRequest.receiver_id == receiver_id,
            ChatRequest.status == "pending",
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have a pending request to this user")

        sender = db.query(User).filter(User.id == sender_id).first()

        req = ChatRequest(
            sender_id=sender_id,
            receiver_id=receiver_id,
            duration_minutes=duration_minutes,
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        return ChatRequestResponse(
            id=req.id,
            sender_id=sender_id,
            sender_username=sender.username,
            receiver_id=receiver_id,
            receiver_username=receiver.username,
            duration_minutes=req.duration_minutes,
            status=req.status,
            created_at=req.created_at,
        )

    @staticmethod
    def respond_to_request(db: Session, request_id: UUID, user_id: UUID, action: str) -> ChatRequestResponse | ChatSessionResponse:
        req = db.query(ChatRequest).filter(ChatRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if req.receiver_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your request")
        if req.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request already handled")

        sender = db.query(User).filter(User.id == req.sender_id).first()
        receiver = db.query(User).filter(User.id == req.receiver_id).first()

        if action == "decline":
            req.status = "declined"
            db.commit()
            return ChatRequestResponse(
                id=req.id,
                sender_id=req.sender_id,
                sender_username=sender.username,
                receiver_id=req.receiver_id,
                receiver_username=receiver.username,
                duration_minutes=req.duration_minutes,
                status=req.status,
                created_at=req.created_at,
            )

        req.status = "accepted"
        now = datetime.now(timezone.utc)
        session = ChatSession(
            request_id=req.id,
            user1_id=req.sender_id,
            user2_id=req.receiver_id,
            duration_minutes=req.duration_minutes,
            started_at=now,
            expires_at=now + timedelta(minutes=req.duration_minutes),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return ChatSessionResponse(
            id=session.id,
            user1_id=session.user1_id,
            user1_username=sender.username,
            user2_id=session.user2_id,
            user2_username=receiver.username,
            duration_minutes=session.duration_minutes,
            started_at=session.started_at,
            expires_at=session.expires_at,
            is_active=session.is_active,
        )

    @staticmethod
    def send_message(db: Session, session_id: UUID, sender_id: UUID, content: str) -> ChatMessageResponse:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if sender_id not in (session.user1_id, session.user2_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not in this chat")

        now = datetime.now(timezone.utc)
        if now >= session.expires_at or not session.is_active:
            if session.is_active:
                session.is_active = False
                db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chat session has expired")

        sender = db.query(User).filter(User.id == sender_id).first()
        msg = ChatMessage(session_id=session_id, sender_id=sender_id, content=content)
        db.add(msg)
        db.commit()
        db.refresh(msg)

        return ChatMessageResponse(
            id=msg.id,
            session_id=msg.session_id,
            sender_id=msg.sender_id,
            sender_username=sender.username,
            content=msg.content,
            created_at=msg.created_at,
        )

    @staticmethod
    def get_session_messages(db: Session, session_id: UUID, user_id: UUID) -> list[ChatMessageResponse]:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if user_id not in (session.user1_id, session.user2_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not in this chat")

        now = datetime.now(timezone.utc)
        if now >= session.expires_at and session.is_active:
            session.is_active = False
            db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
            db.commit()
            return []

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

        results = []
        for m in messages:
            sender = db.query(User).filter(User.id == m.sender_id).first()
            results.append(ChatMessageResponse(
                id=m.id,
                session_id=m.session_id,
                sender_id=m.sender_id,
                sender_username=sender.username if sender else "Deleted",
                content=m.content,
                created_at=m.created_at,
            ))
        return results

    @staticmethod
    def get_user_chats(db: Session, user_id: UUID) -> ChatListResponse:
        now = datetime.now(timezone.utc)

        expired_sessions = db.query(ChatSession).filter(
            ChatSession.expires_at <= now,
            ChatSession.is_active == True,
        ).all()
        for s in expired_sessions:
            s.is_active = False
            db.query(ChatMessage).filter(ChatMessage.session_id == s.id).delete()
        if expired_sessions:
            db.commit()

        pending_requests = (
            db.query(ChatRequest)
            .filter(
                or_(ChatRequest.sender_id == user_id, ChatRequest.receiver_id == user_id),
                ChatRequest.status == "pending",
            )
            .order_by(ChatRequest.created_at.desc())
            .all()
        )

        active_sessions = (
            db.query(ChatSession)
            .filter(
                or_(ChatSession.user1_id == user_id, ChatSession.user2_id == user_id),
                ChatSession.is_active == True,
            )
            .order_by(ChatSession.started_at.desc())
            .all()
        )

        req_responses = []
        for r in pending_requests:
            sender = db.query(User).filter(User.id == r.sender_id).first()
            receiver = db.query(User).filter(User.id == r.receiver_id).first()
            req_responses.append(ChatRequestResponse(
                id=r.id,
                sender_id=r.sender_id,
                sender_username=sender.username if sender else "Deleted",
                receiver_id=r.receiver_id,
                receiver_username=receiver.username if receiver else "Deleted",
                duration_minutes=r.duration_minutes,
                status=r.status,
                created_at=r.created_at,
            ))

        sess_responses = []
        for s in active_sessions:
            u1 = db.query(User).filter(User.id == s.user1_id).first()
            u2 = db.query(User).filter(User.id == s.user2_id).first()
            sess_responses.append(ChatSessionResponse(
                id=s.id,
                user1_id=s.user1_id,
                user1_username=u1.username if u1 else "Deleted",
                user2_id=s.user2_id,
                user2_username=u2.username if u2 else "Deleted",
                duration_minutes=s.duration_minutes,
                started_at=s.started_at,
                expires_at=s.expires_at,
                is_active=s.is_active,
            ))

        return ChatListResponse(requests=req_responses, sessions=sess_responses)

    @staticmethod
    def cleanup_expired(db: Session):
        now = datetime.now(timezone.utc)
        expired = db.query(ChatSession).filter(
            ChatSession.expires_at <= now,
            ChatSession.is_active == True,
        ).all()
        for s in expired:
            s.is_active = False
            db.query(ChatMessage).filter(ChatMessage.session_id == s.id).delete()
        if expired:
            db.commit()

        old_requests = db.query(ChatRequest).filter(
            ChatRequest.status == "pending",
            ChatRequest.created_at <= now - timedelta(hours=24),
        ).all()
        for r in old_requests:
            r.status = "expired"
        if old_requests:
            db.commit()
