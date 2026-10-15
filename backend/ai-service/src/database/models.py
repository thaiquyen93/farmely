from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.database.connection import Base

class Conversation(Base):
    __tablename__ = "conversations"

    conversation_id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    participant_one = Column(BigInteger, nullable=True)   # user_id của khách
    participant_two = Column(BigInteger, nullable=True)   # NULL vì chat với AI
    plot_id = Column(BigInteger, nullable=True)           # ID thửa đất (nếu có)
    rental_id = Column(BigInteger, nullable=True)         # ID hợp đồng (nếu có)
    type = Column(String(50), default="AI", nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    conversation_id = Column(BigInteger, ForeignKey("conversations.conversation_id"), nullable=False)
    sender_id = Column(BigInteger, nullable=True)         # user_id khi khách gửi; NULL khi AI trả lời
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
