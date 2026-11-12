from typing import List, Dict
from src.config import settings

def _mock_llm_response(user_query: str, rag_contexts: List[Dict[str, any]]) -> str:
    """
    Tạo câu trả lời mô phỏng thông minh mang phong cách Farmely AI Assistant
    khi chưa có Gemini API Key hoặc mất kết nối mạng.
    """
    query_lower = user_query.lower()

    if "1 + 1" in query_lower or "1 cộng 1" in query_lower:
        return (
            "1 cộng 1 bằng 2. Nếu bạn cần trao đổi thêm về quy trình thuê thửa đất hoặc kỹ thuật chăm sóc cây trồng trên Farmely, bạn cứ đặt câu hỏi nhé."
        )
    elif "farmely là gì" in query_lower or "hoạt động ra sao" in query_lower or "hoạt động như thế nào" in query_lower or "mô hình" in query_lower or "giới thiệu" in query_lower:
        return (
            "1. **Farmely là gì?**\n"
            "Farmely là nền tảng nông nghiệp số cho phép người dùng thuê các thửa đất canh tác thực tế tại nông trại và theo dõi quá trình trồng trọt trực tuyến (không phải trò chơi hay đất ảo).\n\n"
            "2. **Farmely hoạt động như thế nào?**\n"
            "Hệ thống vận hành qua sự phối hợp giữa 3 vai trò: **Khách hàng** chọn thửa đất, giống cây, hình thức tự chăm sóc (`Self-Growing`) hoặc ủy thác (`Assisted-Growing`) và theo dõi tiến độ; **Chuyên gia nông nghiệp** xây dựng quy trình kỹ thuật và tư vấn khi cần; **Nhân viên hiện trường** trực tiếp thực hiện các công việc chăm sóc tại vườn, ghi nhật ký ảnh và hỗ trợ cân đo thu hoạch.\n\n"
            "3. **Công nghệ hỗ trợ ra sao?**\n"
            "Nền tảng tích hợp dữ liệu cảm biến IoT, thông tin thời tiết địa phương, nhật ký canh tác điện tử theo từng công việc và trợ lý AI hỗ trợ tra cứu quy trình.\n\n"
            "4. **Người dùng nhận được gì?**\n"
            "Người dùng có thể theo dõi quá trình phát triển của cây trồng từ xa qua dữ liệu và hình ảnh minh bạch thay vì phải trực tiếp có mặt mỗi ngày, và nhận nông sản trực tiếp tại trang trại (`PICKUP`) khi thu hoạch.\n\n"
            "Bạn muốn mình giải thích chi tiết hơn về quy trình thuê thửa đất, vai trò của các bên hay tính năng theo dõi nào trên hệ thống?"
        )
    elif "hủy" in query_lower or "hoàn tiền" in query_lower:
        return (
            "Theo chính sách hủy hợp đồng tại Farmely (Điều 10 / BR10), bạn gửi yêu cầu hủy trước ngày bắt đầu canh tác sớm nhất trong hợp đồng (lý do tối thiểu 10 ký tự, do Quản trị viên duyệt):\n"
            "- Trước ngày bắt đầu từ **3 ngày trở lên**: hoàn **80%** tổng tiền đã thanh toán.\n"
            "- Trước ngày bắt đầu **dưới 3 ngày**: hoàn **50%**.\n"
            "- **Từ ngày bắt đầu trở đi**: không hoàn tiền (**0%**)."
        )
    elif "thuê" in query_lower or "giá" in query_lower or "plot" in query_lower or "hợp đồng" in query_lower:
        return (
            "Chào bạn! Về quy trình thuê Plot tại Farmely, bạn thực hiện theo các bước sau:\n"
            "1. Khám phá và chọn Plot phù hợp trên bản đồ Marketplace (diện tích, giá thuê/tháng, giống cây tương thích).\n"
            "2. Đặt lịch tham quan thực tế (ca sáng 08:00–11:30 hoặc ca chiều 13:30–17:00) hoặc nhắn Chuyên gia (CGNN) nếu muốn tư vấn.\n"
            "3. Cấu hình giống cây tương thích, ngày bắt đầu (cách ngày đặt 5–14 ngày), thời hạn 1/2/3/6/12 tháng (tối thiểu chu kỳ giống + 10 ngày đệm) và hình thức **Self-Growing** hoặc **Assisted-Growing**.\n"
            "4. Giữ chỗ 15 phút (+ 10 phút ân hạn thanh toán) và thanh toán trước 100% qua VNPay/VietQR (không thu tiền cọc)."
        )
    elif "rệp" in query_lower or "sâu" in query_lower or "bọ trĩ" in query_lower:
        return (
            "Chào bạn! Đối với dịch hại trên cây trồng, Farmely áp dụng phương pháp quản lý dịch hại tổng hợp (IPM) và biện pháp sinh học an toàn:\n"
            "- Treo bẫy dính màu vàng cách ngọn rau 10-15cm để thu hút bọ trĩ.\n"
            "- Phun dung dịch tỏi ớt gừng lên men hoặc dầu khoáng sinh học SK Enspray 99 EC pha loãng vào chiều mát.\n"
            "- Với sâu tơ, sâu xanh: Sử dụng chế phẩm vi khuẩn sinh học Bacillus thuringiensis (Bt) an toàn tuyệt đối cho con người.\n"
            "Lưu ý: Mọi hướng dẫn chỉ mang tính chất tham khảo kỹ thuật, bạn nên theo dõi thực địa hoặc báo chuyên gia phụ trách để được hướng dẫn chi tiết."
        )
    elif "độ ẩm" in query_lower or "tưới" in query_lower or "nước" in query_lower:
        return (
            "Chào bạn! Theo quy chuẩn canh tác chuẩn VietGAP tại Farmely:\n"
            "- Ngưỡng độ ẩm đất lý tưởng duy trì ở mức 65% - 75%.\n"
            "- Tưới vào sáng sớm (6h - 8h) hoặc chiều mát (16h - 17h30), tránh tưới đêm muộn để hạn chế nấm bệnh.\n"
            "- Nếu trạm cảm biến IoT ghi nhận độ ẩm đất đạt từ 80% trở lên hoặc có mưa lớn, hệ thống sẽ tự động hoãn công việc tưới nước để chống úng rễ."
        )
    elif "phân" in query_lower or "bón" in query_lower or "dinh dưỡng" in query_lower:
        return (
            "Chào bạn! Farmely ưu tiên sử dụng phân bón hữu cơ sinh học đạt chuẩn:\n"
            "- Phân trùn quế đã ủ hoai mục giúp tơi xốp đất và bổ sung hệ vi sinh bản địa.\n"
            "- Bổ sung dịch đạm cá vi sinh (tỉ lệ 1:500 tưới gốc) và dịch chuối giàu Kali giúp rau giòn ngọt.\n"
            "- Quy tắc an toàn: Bắt buộc ngưng bón phân trước ngày thu hoạch tối thiểu 7 ngày để cách ly đảm bảo tiêu chuẩn VietGAP."
        )
    elif "thu hoạch" in query_lower or "mấy ngày" in query_lower or "bao lâu" in query_lower:
        return (
            "Chào bạn! Thời gian thu hoạch phụ thuộc vào từng giống cây trồng:\n"
            "- Rau ăn lá ngắn ngày (cải ngọt, cải thìa, rau dền): Thu hoạch sau 25 - 32 ngày.\n"
            "- Xà lách Romaine / Xà lách xoăn: Thu hoạch sau 35 - 45 ngày (đạt 250 - 350g/cây).\n"
            "- Dưa leo baby: Bắt đầu thu hoạch từ 30 - 35 ngày sau trồng, hái liên tục cách ngày.\n"
            "Khi đến kỳ thu hoạch, công nhân sẽ chụp ảnh đối chứng, cân sản lượng điện tử và cập nhật lên hệ thống để bạn nghiệm thu."
        )
    elif rag_contexts:
        best_doc = rag_contexts[0]
        title = best_doc.get("doc_title", "quy trình kỹ thuật Farmely")
        return (
            f"Chào bạn! Dựa trên tài liệu \"{title}\" của Farmely:\n"
            f"Hệ thống đã ghi nhận thông tin kỹ thuật liên quan đến câu hỏi của bạn. "
            f"Bạn vui lòng kiểm tra thêm chi tiết trong các mục trích xuất bên dưới, hoặc trao đổi trực tiếp với Chuyên gia Nông nghiệp phụ trách để được hướng dẫn tối ưu nhất."
        )
    else:
        return (
            "Chào bạn! Farmely AI Assistant được thiết kế chuyên biệt để hỗ trợ các thông tin về dịch vụ thuê vườn, quy trình canh tác và kỹ thuật chăm sóc cây trồng tại Farmely. "
            "Nếu bạn có thắc mắc liên quan đến thuê đất, chọn giống cây hoặc xử lý sâu bệnh, vui lòng gửi câu hỏi để tôi hỗ trợ bạn tốt nhất nhé!"
        )

def generate_chat_response(prompt: str, user_query: str, rag_contexts: List[Dict[str, any]]) -> str:
    """
    Gửi prompt đến Google Gemini API qua HTTP REST với timeout tối đa 15 giây.
    Nếu quá thời gian hoặc API lỗi, tự động chuyển sang mô phỏng thông minh dựa trên RAG context.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return _mock_llm_response(user_query, rag_contexts)

    try:
        import requests
        candidate_models = [settings.LLM_MODEL.replace("models/", ""), "gemini-3.5-flash-lite", "gemini-3-flash-preview"]
        seen = set()
        models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.25,
                "maxOutputTokens": 2048
            }
        }
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
            res = requests.post(url, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
            else:
                print(f"[WARN] Gemini API ({model_name}) trả về mã {res.status_code}: {res.text[:120]}")
        return _mock_llm_response(user_query, rag_contexts)
    except Exception as e:
        print(f"[WARN] Gọi Gemini LLM lỗi/timeout ({e}), chuyển sang Mock Response.")
        return _mock_llm_response(user_query, rag_contexts)
