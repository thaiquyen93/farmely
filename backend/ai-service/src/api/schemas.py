from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    userId: Optional[int] = Field(default=None, description="ID người dùng gửi tin")
    conversationId: Optional[int] = Field(default=None, description="ID phiên trò chuyện nếu đã có")
    plotId: Optional[int] = Field(default=None, description="ID thửa đất liên quan (optional)")
    message: str = Field(..., min_length=1, description="Nội dung câu hỏi của người dùng")

class ReferencedDocumentDto(BaseModel):
    chunkId: int
    docTitle: str
    sectionTitle: str
    source: str
    similarityScore: float

class ChatResponse(BaseModel):
    conversationId: int
    reply: str
    referencedDocuments: List[ReferencedDocumentDto] = []
    status: str = "SUCCESS"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MessageItemDto(BaseModel):
    messageId: int
    sender: str  # 'user' | 'ai'
    senderId: Optional[int] = None
    content: str
    createdAt: Optional[str] = None

class ConversationMessagesResponse(BaseModel):
    conversationId: int
    messages: List[MessageItemDto]
