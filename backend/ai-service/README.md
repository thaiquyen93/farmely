# 🌾 Farmely AI Chatbot Service (`ai-service`)

Microservice tư vấn nông nghiệp thông minh **"Bác Ba Nông Dân"** xây dựng trên nền tảng **RAG (Retrieval-Augmented Generation) Từ Đầu (From-Scratch)**, không sử dụng framework trung gian (LangChain / LlamaIndex), tích hợp chuẩn vào hệ thống Farmely.

---

## 🌟 Tính Năng Nổi Bật

1. **RAG From-Scratch (Không phụ thuộc LangChain):**
   - Tự viết hàm toán học **Cosine Similarity** bằng NumPy: $\frac{A \cdot B}{\|A\| \cdot \|B\|}$.
   - Trích xuất Top-K đoạn ngữ cảnh bằng thuật toán sắp xếp ma trận `np.argsort(-scores)`.
2. **Kiến Trúc 2 Pha Chuẩn ML:**
   - **Offline Ingestion:** Đọc tài liệu Markdown (`data/raw/`), cắt nhỏ theo tiêu đề (`chunker.py`), sinh vector nhúng và lưu thành `data/processed/vectors.npy` + `chunks.json`.
   - **Online Query:** Nhận câu hỏi, tìm kiếm tương đồng trên RAM trong < 1 mili-giây, ghép prompt và gọi Gemini 1.5 Flash.
3. **Nhân cách "Bác Ba Nông Dân":**
   - Phong cách mộc mạc, đậm chất nhà nông Nam Bộ, xưng "Bác - cháu".
   - Tuân thủ nghiêm ngặt tiêu chuẩn VietGAP (tuyệt đối không dùng phân thuốc hóa học độc hại).
   - Từ chối hài hước các câu hỏi ngoài phạm vi (code, giải toán, chính trị...).
   - Đính kèm tuyên bố miễn trừ trách nhiệm (Disclaimer).
4. **Quản lý Phiên & Lưu trữ PostgreSQL:**
   - Đọc/ghi các bảng `conversations` và `messages` từ schema PostgreSQL của Farmely.
   - Hỗ trợ fallback tự động sang SQLite nội bộ (`data/chat.db`) nếu môi trường phát triển chưa bật Docker PostgreSQL.
5. **Tích hợp Liền Mạch:**
   - Cổng API: `8089` (khớp route `/api/ai/**` của Spring Cloud API Gateway `8080`).
   - Kết nối trực tiếp vào React Dashboard (`CustomerDashboard.jsx`).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn bị môi trường Python (Python 3.10+)
```bash
cd backend/ai-service

# Tạo và kích hoạt môi trường ảo (Khuyến nghị)
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/Mac:
source .venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt
```

### 2. Cấu hình biến môi trường
File `.env` đã được tạo sẵn tại thư mục gốc của service:
```env
PORT=8089
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=models/text-embedding-004
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartagrirent_ai
FALLBACK_SQLITE=True
```
> *Mẹo:* Bạn có thể lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/). Nếu chưa cấu hình Key, hệ thống sẽ tự động kích hoạt **Mock Fallback thông minh** để phục vụ chạy thử nghiệm.

### 3. Chạy Pipeline Offline Ingestion
Chạy lệnh sau để xử lý tài liệu trong `data/raw/` và sinh vector nhúng:
```bash
python scripts/run_ingest.py
```
Kết quả sẽ tạo ra 2 file trong `data/processed/`:
- `vectors.npy`: Ma trận các vector số thực (shape: `(N, 768)`).
- `chunks.json`: Danh sách các đoạn văn bản kèm nguồn trích dẫn.

### 4. Khởi động AI Microservice
```bash
python main.py
```
Hoặc dùng uvicorn:
```bash
uvicorn main:app --port 8089 --reload
```
Server sẽ chạy tại: **`http://localhost:8089`**
Tài liệu tương tác Swagger UI: **`http://localhost:8089/docs`**

---

## 📡 Danh Sách API

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/api/ai/chat` | Gửi tin nhắn trò chuyện với Bác Ba Nông Dân qua RAG |
| `GET` | `/api/ai/conversations/{id}/messages` | Lấy lịch sử tin nhắn của phiên chat |
| `GET` | `/api/ai/health` | Kiểm tra trạng thái service và số lượng vector trên RAM |
| `GET` | `/docs` | Giao diện Swagger UI thử nghiệm trực tiếp |

---

## 🧪 Nghiên Cứu Thực Nghiệm (Lab Notebook)
Mở file `notebooks/rag_experiments.ipynb` bằng VS Code / Jupyter Lab để quan sát:
- Đo lường điểm số tương đồng cosine giữa các câu hỏi thử nghiệm và tài liệu.
- Minh chứng thuật toán `argsort` phục vụ báo cáo bảo vệ đồ án ISP392.
