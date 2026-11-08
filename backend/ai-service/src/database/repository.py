from typing import List, Optional
from sqlalchemy.orm import Session
from src.database.models import Conversation, Message

def get_or_create_conversation(
    db: Session,
    user_id: Optional[int] = None,
    plot_id: Optional[int] = None,
    conversation_id: Optional[int] = None
) -> Conversation:
    """
    Tìm cuộc hội thoại đã có hoặc tạo mới cuộc hội thoại AI nếu chưa tồn tại.
    """
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.conversation_id == conversation_id).first()
        if conv:
            return conv

    # Tạo mới conversation
    conv = Conversation(
        participant_one=user_id,
        participant_two=None,
        plot_id=plot_id,
        type="AI",
        status="OPEN"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

def get_recent_messages(db: Session, conversation_id: int, limit: int = 6) -> List[dict]:
    """
    Lấy danh sách các tin nhắn gần nhất trong phiên hội thoại để làm ngữ cảnh.
    """
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.message_id.desc())
        .limit(limit)
        .all()
    )
    # Đảo ngược lại theo thứ tự thời gian cũ -> mới
    messages.reverse()
    return [
        {
            "message_id": m.message_id,
            "sender": "user" if m.sender_id is not None else "ai",
            "sender_id": m.sender_id,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]

def save_message(db: Session, conversation_id: int, sender_id: Optional[int], content: str) -> Message:
    """
    Lưu một tin nhắn mới vào cơ sở dữ liệu.
    """
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
