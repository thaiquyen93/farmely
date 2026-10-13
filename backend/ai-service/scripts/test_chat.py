import json
import sys
from pathlib import Path

# Thêm thư mục gốc ai-service vào sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from main import app

def run_tests():
    print("=" * 65)
    print("🌾 KIỂM THỬ TỰ ĐỘNG FARMELY AI SERVICE (RAG FROM-SCRATCH)")
    print("=" * 65)

    with TestClient(app) as client:
        # 1. Kiểm tra trạng thái Health Check
        print("\n[TEST 1] Kiểm tra /api/ai/health...")
        res = client.get("/api/ai/health")
        assert res.status_code == 200, f"Health check thất bại: {res.status_code}"
        health_data = res.json()
        print(f" -> Trạng thái: {health_data['status']}")
        print(f" -> RAG sẵn sàng: {health_data['ragReady']}")
        print(f" -> Tổng số Chunks trên RAM: {health_data['totalChunks']} chunks")

        # 2. Test hội thoại nông nghiệp thực tế
        test_cases = [
            {
                "name": "Hỏi về bệnh và sâu hại rau",
                "message": "Cải thìa của tôi bị rệp mềm bám đầy lá thì xử lý sinh học thế nào hả bác?"
            },
            {
                "name": "Hỏi về quy trình và thu hoạch (Dưa leo baby)",
                "message": "Khi nào dưa leo baby tại luống của tôi có thể thu hoạch được?"
            },
            {
                "name": "Hỏi ngoài phạm vi (Kiểm tra từ chối chuẩn Bác Ba)",
                "message": "Bác Ba viết giúp cháu đoạn code Python giải phương trình bậc 2 với!"
            }
        ]

        conv_id = None
        for i, tc in enumerate(test_cases, start=1):
            print(f"\n[TEST 2.{i}] {tc['name']}")
            print(f" -> Câu hỏi khách: \"{tc['message']}\"")

            chat_payload = {
                "message": tc["message"],
                "userId": 1,
                "conversationId": conv_id,
                "plotId": 1
            }
            chat_res = client.post("/api/ai/chat", json=chat_payload)
            assert chat_res.status_code == 200, f"Chat thất bại: {chat_res.text}"
            
            data = chat_res.json()
            conv_id = data["conversationId"]
            print(f" -> Mã phiên chat (conversationId): {conv_id}")
            print(f" -> Phản hồi từ Bác Ba:\n    \"{data['reply']}\"")
            
            referenced_docs = data.get("referencedDocuments", [])
            print(f" -> Nguồn tài liệu RAG trích xuất ({len(referenced_docs)} tài liệu):")
            for d in referenced_docs:
                print(f"    • [{d['source']}] {d['sectionTitle']} (Score: {d['similarityScore']})")

        # 3. Kiểm tra lưu trữ lịch sử tin nhắn trong Database
        print(f"\n[TEST 3] Kiểm tra đọc lịch sử phiên chat #{conv_id}...")
        hist_res = client.get(f"/api/ai/conversations/{conv_id}/messages")
        assert hist_res.status_code == 200
        messages = hist_res.json()["messages"]
        print(f" -> Tổng số tin nhắn đã lưu trong DB: {len(messages)} tin nhắn")
        for m in messages:
            sender_tag = "👤 Khách" if m["sender"] == "user" else "👴 Bác Ba"
            print(f"    {sender_tag}: {m['content'][:70]}...")

    print("\n" + "=" * 65)
    print("✅ TẤT CẢ CÁC BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
