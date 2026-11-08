from typing import List, Dict
from src.generation.persona import FARMELY_AI_SYSTEM_INSTRUCTION

def build_chat_prompt(
    user_query: str,
    rag_contexts: List[Dict[str, any]],
    chat_history: List[Dict[str, str]] = None
) -> str:
    """
    Xây dựng Prompt hoàn chỉnh để gửi tới LLM bao gồm:
    1. System Instruction (Farmely AI Assistant)
    2. Ngữ cảnh trích xuất từ tài liệu quy trình RAG
    3. Lịch sử hội thoại nhiều lượt gần nhất (Multi-turn Memory)
    4. Câu hỏi hiện tại của người dùng
    """
    prompt_parts = [FARMELY_AI_SYSTEM_INSTRUCTION.strip()]

    # 1. Thêm ngữ cảnh RAG nếu tìm thấy tài liệu phù hợp
    if rag_contexts:
        context_str = "\n\n".join([
            f"[Tài liệu #{i+1}: {c.get('doc_title', '')} - {c.get('section_title', '')} (Nguồn: {c.get('source', '')})]\n{c.get('content', '')}"
            for i, c in enumerate(rag_contexts)
        ])
        prompt_parts.append(f"\n--- [TÀI LIỆU KỸ THUẬT & NGHIỆP VỤ FARMELY DÙNG ĐỂ THAM KHẢO] ---\n{context_str}\n------------------------------------------------------------")
    else:
        prompt_parts.append("\n[LƯU Ý: Không tìm thấy tài liệu trực tiếp cho câu hỏi này trong hệ thống. Hãy trả lời dựa trên kiến thức nông nghiệp tổng quát và hướng dẫn liên hệ chuyên gia Farmely nếu cần.]")

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
