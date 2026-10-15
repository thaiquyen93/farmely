from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database.connection import get_db
from src.database.repository import (
    get_or_create_conversation,
    get_recent_messages,
    save_message
)
from src.rag.retriever import retrieve_context
from src.generation.prompt_builder import build_chat_prompt
from src.generation.llm_client import generate_chat_response
from src.api.schemas import (
    ChatRequest,
    ChatResponse,
    ReferencedDocumentDto,
    ConversationMessagesResponse,
    MessageItemDto
)

router = APIRouter(prefix="/api/ai", tags=["AI Chatbot"])

@router.post("/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Endpoint nhận tin nhắn người dùng và trả về phản hồi từ Bác Ba Nông Dân qua RAG:
    1. Quản lý Conversation & lấy lịch sử hội thoại gần nhất.
    2. Lưu tin nhắn của người dùng vào database.
    3. Tìm kiếm ngữ cảnh nông nghiệp liên quan qua RAG (From-Scratch Cosine Similarity).
    4. Ghép Prompt & Gọi LLM (Gemini 1.5 Flash).
    5. Lưu phản hồi của AI vào database và trả về cho Frontend.
    """
    try:
        # 1. Tìm hoặc tạo mới Conversation
        conversation = get_or_create_conversation(
            db=db,
            user_id=payload.userId,
            plot_id=payload.plotId,
            conversation_id=payload.conversationId
        )

        # 2. Lấy 4-6 tin nhắn trước đó làm bộ nhớ trong phiên (In-Session Memory)
        history = get_recent_messages(db=db, conversation_id=conversation.conversation_id, limit=6)

        # 3. Lưu tin nhắn của người dùng
        save_message(
            db=db,
            conversation_id=conversation.conversation_id,
            sender_id=payload.userId,
            content=payload.message
        )

        # 4. Tìm kiếm ngữ cảnh nông nghiệp qua RAG Core
        rag_contexts = retrieve_context(query=payload.message)

        # 5. Xây dựng Prompt và Sinh câu trả lời
        full_prompt = build_chat_prompt(
            user_query=payload.message,
            rag_contexts=rag_contexts,
            chat_history=history
        )
        ai_reply = generate_chat_response(
            prompt=full_prompt,
            user_query=payload.message,
            rag_contexts=rag_contexts
        )

        # 6. Lưu câu trả lời của AI vào Database (sender_id = None)
        save_message(
            db=db,
            conversation_id=conversation.conversation_id,
            sender_id=None,
            content=ai_reply
        )

        # 7. Định dạng danh sách tài liệu trích dẫn
        referenced_docs = [
            ReferencedDocumentDto(
                chunkId=c["chunk_id"],
                docTitle=c.get("doc_title", ""),
                sectionTitle=c.get("section_title", ""),
                source=c.get("source", ""),
                similarityScore=c.get("similarity_score", 0.0)
            )
            for c in rag_contexts
        ]

        return ChatResponse(
            conversationId=conversation.conversation_id,
            reply=ai_reply,
            referencedDocuments=referenced_docs,
            status="SUCCESS"
        )
    except Exception as e:
        print(f"[ERROR] Xử lý chat thất bại: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages", response_model=ConversationMessagesResponse)
def get_conversation_history(conversation_id: int, db: Session = Depends(get_db)):
    """
    Lấy toàn bộ lịch sử tin nhắn của một phiên hội thoại.
    """
    messages = get_recent_messages(db=db, conversation_id=conversation_id, limit=50)
    items = [
        MessageItemDto(
            messageId=m["message_id"],
            sender=m["sender"],
            senderId=m["sender_id"],
            content=m["content"],
            createdAt=m["created_at"]
        )
        for m in messages
    ]
    return ConversationMessagesResponse(
        conversationId=conversation_id,
        messages=items
    )

@router.get("/health")
def health_check():
    """Kiểm tra trạng thái hoạt động của ai-service"""
    from src.rag.vector_store import vector_store
    return {
        "status": "UP",
        "service": "Farmely AI Chatbot Service",
        "ragReady": vector_store.is_ready,
        "totalChunks": len(vector_store.chunks) if vector_store.is_ready else 0
    }
