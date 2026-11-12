import unicodedata
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Optional

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


def _normalize_vi_text(value: str) -> str:
    nfd = unicodedata.normalize("NFD", (value or "").lower())
    return "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn").replace("đ", "d")


def _classify_query_intent(query: str) -> Dict[str, bool]:
    norm = _normalize_vi_text(query)
    needs_farms_plots = bool(re.search(
        r"(trang trai|khu dat|o dau|dia diem|con trong|thua nao|ma thua|dien tich|gia thue|bao nhieu tien|bang gia|\bp-\s*\d+)",
        norm
    ))
    needs_varieties = bool(re.search(
        r"(giong cay|giong rau|loai rau nao|cay gi|trong duoc|danh muc cay|ho tro trong)",
        norm
    ))
    needs_services = bool(re.search(
        r"(dich vu|goi cham soc|bang phi|phi cham soc|bon phan|tuoi ho)",
        norm
    ))
    needs_user_rentals = bool(re.search(
        r"(cua toi|dang thue|vuon cua toi|thua cua toi|thua cua minh|vuon cua minh|nhiet do hien tai|do am hien tai|cam bien|iot hien tai|nhat ky cua toi|cong viec hom nay|rental)",
        norm
    ))
    is_overview = bool(re.search(
        r"(farmely la gi|hoat dong ra sao|hoat dong nhu the nao|mo hinh|gioi thieu.*farmely|cach thuc hoat dong|nen tang farmely)",
        norm
    )) and not (needs_farms_plots or needs_varieties or needs_user_rentals)
    return {
        "is_overview": is_overview,
        "needs_farms_plots": needs_farms_plots,
        "needs_varieties": needs_varieties,
        "needs_services": needs_services,
        "needs_user_rentals": needs_user_rentals,
    }


def _build_response_guidance(intent: Dict[str, bool]) -> str:
    if intent.get("is_overview"):
        return (
            "Đây là câu hỏi TỔNG QUAN về nền tảng Farmely. Bắt buộc trả lời SÚC TÍCH (150–250 từ), giọng khách quan, trung lập theo đúng 4 mục:\n"
            "1. **Farmely là gì?** — Giải thích bản chất sản phẩm.\n"
            "2. **Farmely hoạt động như thế nào?** — Quy trình tổng quan và làm rõ mối quan hệ Khách hàng – Chuyên gia nông nghiệp – Nhân viên hiện trường.\n"
            "3. **Công nghệ hỗ trợ ra sao?** — Vai trò cảm biến IoT, dữ liệu thời tiết/vi khí hậu, nhật ký điện tử và AI.\n"
            "4. **Người dùng nhận được gì?** — Giá trị thực tế và nhận nông sản tại nông trại sau thu hoạch.\n"
            "TUYỆT ĐỐI KHÔNG tự liệt kê tên trang trại cụ thể (như Happy Valley), mã thửa (như P-16), giá thuê, diện tích hay danh sách cây; KHÔNG dùng ngôn từ quảng cáo bán hàng hay mời chọn thửa cụ thể. Kết thúc bằng một câu hỏi mở lịch sự để tiếp tục hội thoại."
        )
    return (
        "Trả lời thẳng trọng tâm, khách quan. Chỉ nêu số liệu, tên trang trại, mã thửa, giá, giống cây hoặc tình trạng sở hữu/chứng nhận khi thông tin đó có trong ngữ cảnh xác thực được cấp; nếu thiếu dữ liệu xác thực thì nói rõ phạm vi chưa có."
    )


def _load_live_farmely_context(
    db: Session,
    user_id: Optional[int] = None,
    plot_id: Optional[int] = None,
    rental_id: Optional[int] = None,
    plot_code: Optional[str] = None,
    intent: Optional[Dict[str, bool]] = None,
) -> str:
    intent = intent or {}
    if not any([
        intent.get("needs_farms_plots"),
        intent.get("needs_varieties"),
        intent.get("needs_services"),
        intent.get("needs_user_rentals"),
    ]):
        return ""

    sections = []
    try:
        if intent.get("needs_farms_plots"):
            lands = db.execute(text("""
                SELECT land_name, address, COALESCE(is_published, false) AS is_published
                FROM lands ORDER BY land_id
            """)).fetchall()
            if lands:
                land_lines = [
                    f"- {r.land_name} ({r.address}) [{'Đang mở cho thuê' if r.is_published else 'Chuẩn bị mở'}]"
                    for r in lands
                ]
                sections.append("Trang trại đang niêm yết trên hệ thống Farmely:\n" + "\n".join(land_lines))

            plots = db.execute(text("""
                SELECT p.status::text AS status, COUNT(*) AS cnt,
                       ROUND(MIN(p.area)::numeric, 0) AS min_area,
                       ROUND(MAX(p.area)::numeric, 0) AS max_area,
                       ROUND(MIN(p.price_per_period)::numeric, 0) AS min_price,
                       ROUND(MAX(p.price_per_period)::numeric, 0) AS max_price
                FROM plots p
                WHERE COALESCE(p.is_published, true) = true
                GROUP BY p.status
            """)).fetchall()
            avail_codes = db.execute(text("""
                SELECT p.plot_code, ROUND(p.area::numeric, 0) AS area, ROUND(p.price_per_period::numeric, 0) AS price
                FROM plots p
                WHERE COALESCE(p.is_published, true) = true AND p.status = 'AVAIL'
                ORDER BY p.plot_id LIMIT 8
            """)).fetchall()
            if plots:
                summary = ", ".join([
                    f"{r.status}: {r.cnt} thửa ({int(r.min_area)}-{int(r.max_area)} m², {int(r.min_price):,}-{int(r.max_price):,} đ/tháng)"
                    for r in plots
                ])
                sample_avail = ", ".join([f"{r.plot_code} ({int(r.area)}m² - {int(r.price):,}đ/tháng)" for r in avail_codes])
                sections.append(f"Tổng quan Plot đang mở: {summary}." + (f"\nMột số Plot còn trống: {sample_avail}." if sample_avail else ""))

        if intent.get("needs_varieties"):
            varieties = db.execute(text("""
                SELECT variety_name, expected_duration, COALESCE(is_active, true) AS is_active
                FROM varieties
                WHERE COALESCE(is_active, true) = true
                ORDER BY variety_id
            """)).fetchall()
            if varieties:
                sections.append("Giống cây đang cung cấp trên hệ thống: " + ", ".join([f"{v.variety_name} ({v.expected_duration} ngày)" for v in varieties]))

        if intent.get("needs_services"):
            services = db.execute(text("""
                SELECT service_name, service_type::text AS service_type, ROUND(price::numeric, 0) AS price
                FROM services ORDER BY service_id LIMIT 15
            """)).fetchall()
            if services:
                sections.append("Dịch vụ canh tác: " + ", ".join([f"{s.service_name} ({int(s.price):,}đ)" for s in services]))

        if intent.get("needs_user_rentals") and user_id:
            rentals = db.execute(text("""
                SELECT r.rental_id, p.plot_code, v.variety_name, r.cultivation_mode, r.start_date::text, r.end_date::text, r.status,
                       COALESCE(ds.current_day, CASE WHEN CURRENT_DATE < r.start_date THEN 0 ELSE (CURRENT_DATE - r.start_date) + 1 END) AS current_day,
                       COALESCE(v.expected_duration, 45) AS total_days
                FROM rentals r
                JOIN contracts c ON r.contract_id = c.contract_id
                JOIN plots p ON r.plot_id = p.plot_id
                LEFT JOIN varieties v ON r.variety_id = v.variety_id
                LEFT JOIN LATERAL (
                    SELECT current_day FROM demo_cultivation_state WHERE rental_id = r.rental_id AND is_active ORDER BY updated_at DESC LIMIT 1
                ) ds ON true
                WHERE c.renter_id = :uid AND r.status = 'ACTIVE'
                ORDER BY r.rental_id DESC LIMIT 5
            """), {"uid": user_id}).fetchall()
            if rentals:
                r_lines = [
                    f"- Rental #{r.rental_id} ({r.plot_code}): giống {r.variety_name}, chế độ {r.cultivation_mode}, ngày tuổi {r.current_day}/{r.total_days}, kỳ {r.start_date} -> {r.end_date}"
                    for r in rentals
                ]
                sections.append("Thửa đất khách hàng hiện tại đang thuê:\n" + "\n".join(r_lines))
    except Exception:
        pass
    return "\n\n".join(sections)

@router.post("/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Endpoint nhận tin nhắn người dùng và trả về phản hồi từ Farmely AI Chatbot qua RAG:
    1. Quản lý Conversation & lấy lịch sử hội thoại gần nhất.
    2. Lưu tin nhắn của người dùng vào database.
    3. Tìm kiếm ngữ cảnh nông nghiệp liên quan qua RAG (From-Scratch Cosine Similarity).
    4. Nạp dữ liệu nghiệp vụ thời gian thực từ PostgreSQL.
    5. Ghép Prompt & Gọi LLM (Gemini).
    6. Lưu phản hồi của AI vào database và trả về cho Frontend.
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
        if not history and payload.history:
            history = [
                {"sender": "user" if m.get("sender") == "user" else "ai", "content": str(m.get("content") or m.get("text") or "")}
                for m in payload.history[-6:] if (m.get("content") or m.get("text"))
            ]

        # 3. Lưu tin nhắn của người dùng
        save_message(
            db=db,
            conversation_id=conversation.conversation_id,
            sender_id=payload.userId,
            content=payload.message
        )

        # 4. Tìm kiếm ngữ cảnh nông nghiệp qua RAG Core + Dữ liệu thực tế DB (theo ý định câu hỏi)
        intent = _classify_query_intent(payload.message)
        rag_contexts = retrieve_context(query=payload.message)
        live_context = _load_live_farmely_context(
            db=db,
            user_id=payload.userId,
            plot_id=payload.plotId,
            rental_id=payload.rentalId,
            plot_code=payload.plotCode,
            intent=intent,
        )

        # 5. Xây dựng Prompt và Sinh câu trả lời
        full_prompt = build_chat_prompt(
            user_query=payload.message,
            rag_contexts=rag_contexts,
            chat_history=history,
            live_context=live_context,
            response_guidance=_build_response_guidance(intent),
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
        "ragEngine": "python",
        "ragReady": vector_store.is_ready,
        "totalChunks": len(vector_store.chunks) if vector_store.is_ready else 0
    }
