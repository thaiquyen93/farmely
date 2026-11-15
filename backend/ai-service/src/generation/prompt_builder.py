from typing import List, Dict, Optional
from src.generation.persona import FARMELY_AI_SYSTEM_INSTRUCTION

def build_chat_prompt(
    user_query: str,
    rag_contexts: List[Dict[str, any]],
    chat_history: List[Dict[str, str]] = None,
    live_context: Optional[str] = None,
    response_guidance: Optional[str] = None
) -> str:
    """
    Xây dựng Prompt hoàn chỉnh để gửi tới LLM bao gồm:
    1. System Instruction (Farmely AI Assistant)
    2. Dữ liệu hệ thống Farmely thời gian thực từ PostgreSQL (chỉ khi câu hỏi cần tra cứu)
    3. Ngữ cảnh trích xuất từ tài liệu quy trình RAG
    4. Chỉ dẫn ngữ cảnh định dạng câu trả lời theo ý định hỏi
    5. Lịch sử hội thoại nhiều lượt gần nhất (Multi-turn Memory)
    6. Câu hỏi hiện tại của người dùng
    """
    prompt_parts = [FARMELY_AI_SYSTEM_INSTRUCTION.strip()]

    if live_context and live_context.strip():
        prompt_parts.append(
            f"\n--- [DỮ LIỆU VẬN HÀNH HIỆN TẠI TRÊN FARMELY (TỪ HỆ THỐNG)] ---\n{live_context.strip()}\n------------------------------------------------------------------"
        )

    # 1. Thêm ngữ cảnh RAG nếu tìm thấy tài liệu phù hợp
    if rag_contexts:
        context_str = "\n\n".join([
            f"[Tài liệu nội bộ #{i+1}: {c.get('doc_title', '')} - {c.get('section_title', '')} (Nguồn: {c.get('source', '')})]\n{c.get('content', '')}"
            for i, c in enumerate(rag_contexts)
        ])
        prompt_parts.append(
            f"\n--- [KHO TRI THỨC NỘI BỘ FARMELY — CHỈ DÙNG ĐỂ TRA CỨU TƯ VẤN KHÁCH HÀNG, KHÔNG PHẢI DO KHÁCH HÀNG CUNG CẤP] ---\n{context_str}\n------------------------------------------------------------"
        )
    else:
        prompt_parts.append("\n[LƯU Ý: Kho tri thức nội bộ chưa có đoạn trích khớp trực tiếp. Chỉ sử dụng thông tin nền tảng đã xác nhận của Farmely, tuyệt đối không tự suy diễn giá thuê, tên trang trại, mã thửa, danh sách cây hay thông tin chứng nhận.]")

    if response_guidance and response_guidance.strip():
        prompt_parts.append(f"\n--- [CHỈ DẪN ĐỊNH DẠNG VÀ PHẠM VI] ---\n{response_guidance.strip()}")

    # 2. Thêm lịch sử trò chuyện trong phiên (in-session memory)
    if chat_history:
        history_lines = []
        for msg in chat_history[-6:]:  # Lấy tối đa 6 tin nhắn gần nhất
            sender_label = "Khách hàng" if msg.get("sender") == "user" else "Farmely AI Assistant"
            content = msg.get("content", "").strip()
            history_lines.append(f"{sender_label}: {content}")
        
        history_str = "\n".join(history_lines)
        prompt_parts.append(f"\n--- [LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY CỦA PHIÊN NÀY] ---\n{history_str}\n-------------------------------------------------")

    # 3. Thêm câu hỏi của người dùng
    prompt_parts.append(f"\nKhách hàng: {user_query.strip()}\nFarmely AI Assistant:")

    return "\n".join(prompt_parts)
