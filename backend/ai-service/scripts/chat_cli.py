import sys
from pathlib import Path

# Thêm thư mục gốc ai-service vào sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.rag.vector_store import vector_store
from src.rag.retriever import retrieve_context
from src.generation.prompt_builder import build_chat_prompt
from src.generation.llm_client import generate_chat_response

def ask_question(query: str, history: list) -> str:
    # 1. Tìm kiếm ngữ cảnh RAG
    contexts = retrieve_context(query)
    
    # 2. Ghép prompt
    prompt = build_chat_prompt(user_query=query, rag_contexts=contexts, chat_history=history)
    
    # 3. Sinh câu trả lời
    reply = generate_chat_response(prompt=prompt, user_query=query, rag_contexts=contexts)
    
    # In câu trả lời
    print(f"\n🤖 Farmely AI Assistant:\n{reply}\n")
    
    # In nguồn tài liệu nếu có
    if contexts:
        print("📖 [Tài liệu RAG tham khảo]:")
        for c in contexts:
            print(f"   • {c.get('source', '')} | {c.get('section_title', '')} (Độ tương đồng: {c.get('similarity_score', 0)})")
    print("-" * 65)
    
    # Lưu vào history
    history.append({"sender": "user", "content": query})
    history.append({"sender": "ai", "content": reply})
    return reply

def main():
    print("=" * 65)
    print("🌾 HỘP THOẠI TRÒ CHUYỆN FARMELY AI ASSISTANT (CLI)")
    print("   (Nhập câu hỏi và nhấn Enter. Gõ 'exit' hoặc 'q' để thoát)")
    print("=" * 65)

    # Tải dữ liệu vector lên RAM
    print("[Hệ thống] Đang nạp dữ liệu vector vào RAM...")
    vector_store.load()
    print(f"[Hệ thống] Đã nạp thành công {len(vector_store.chunks)} chunks tri thức nông nghiệp.\n")

    history = []

    # Nếu người dùng truyền câu hỏi trực tiếp qua command line argument
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:]).strip()
        print(f"👤 Bạn hỏi: {query}")
        ask_question(query, history)
        return

    # Chế độ trò chuyện tương tác trực tiếp nhiều lượt
    while True:
        try:
            query = input("👤 Bạn: ").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                print("\nBác Ba: Tạm biệt cháu nghen! Chúc vườn rau của cháu luôn xanh tốt bội thu! 👋")
                break
            ask_question(query, history)
        except (KeyboardInterrupt, EOFError):
            print("\n\nThoát chương trình.")
            break

if __name__ == "__main__":
    main()
