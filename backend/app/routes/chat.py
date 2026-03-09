from uuid import UUID
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.db.database import get_db, SessionLocal
from app.models.user import User
from app.schemas.chat import (
    ChatRequestCreate,
    ChatRequestAction,
    ChatRequestResponse,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatListResponse,
)
from app.services.chat_service import ChatService
from app.services.push_service import PushService

router = APIRouter()

active_connections: dict[str, list[WebSocket]] = {}


@router.get("", response_model=ChatListResponse)
async def get_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.get_user_chats(db, current_user.id)


@router.post("/request", response_model=ChatRequestResponse, status_code=201)
async def create_chat_request(
    data: ChatRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = ChatService.create_request(db, current_user.id, data.receiver_id, data.duration_minutes)
    tokens = PushService.get_tokens_for_users(db, [data.receiver_id])
    if tokens:
        await PushService.send_notifications(
            tokens,
            "Chat Request",
            f"{current_user.username} wants to chat with you for {data.duration_minutes} minutes!",
            {"type": "chat_request", "requestId": str(result.id)},
        )
    return result


@router.post("/request/{request_id}/respond")
async def respond_to_chat_request(
    request_id: UUID,
    data: ChatRequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = ChatService.respond_to_request(db, request_id, current_user.id, data.action)
    return result


@router.get("/session/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_session_messages(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.get_session_messages(db, session_id, current_user.id)


@router.post("/session/{session_id}/message", response_model=ChatMessageResponse, status_code=201)
async def send_message(
    session_id: UUID,
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = ChatService.send_message(db, session_id, current_user.id, data.content)

    session_id_str = str(session_id)
    if session_id_str in active_connections:
        msg_data = {
            "type": "message",
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "sender_username": msg.sender_username,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        import json
        for ws in active_connections[session_id_str]:
            try:
                await ws.send_text(json.dumps(msg_data))
            except Exception:
                pass

    return msg


@router.websocket("/ws/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return

    if session_id not in active_connections:
        active_connections[session_id] = []
    active_connections[session_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            import json
            parsed = json.loads(data)

            if parsed.get("type") == "message":
                db = SessionLocal()
                try:
                    msg = ChatService.send_message(
                        db, UUID(session_id), UUID(user_id), parsed["content"]
                    )
                    msg_data = {
                        "type": "message",
                        "id": str(msg.id),
                        "sender_id": str(msg.sender_id),
                        "sender_username": msg.sender_username,
                        "content": msg.content,
                        "created_at": msg.created_at.isoformat(),
                    }
                    for ws in active_connections.get(session_id, []):
                        try:
                            await ws.send_text(json.dumps(msg_data))
                        except Exception:
                            pass
                except Exception as e:
                    await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
                finally:
                    db.close()

    except WebSocketDisconnect:
        pass
    finally:
        if session_id in active_connections:
            active_connections[session_id] = [
                ws for ws in active_connections[session_id] if ws != websocket
            ]
            if not active_connections[session_id]:
                del active_connections[session_id]
