# Communication Service - Smart AgriRent (Farmely)

Dịch vụ quản lý giao tiếp, nhắn tin tư vấn trực tiếp 1-1 giữa Khách hàng và Chuyên gia Nông nghiệp, chỉ đạo công nhân hiện trường và trợ lý AI.

## 1. Cấu hình kỹ thuật
- **Port**: `8087`
- **Framework**: Spring Boot 3.3.4 (Java 21)
- **Database**: PostgreSQL (Bảng `conversations`, `messages`, `notifications`)
- **Giao thức**: REST API + STOMP WebSocket (`/ws-chat`)
- **Swagger Docs**: `http://localhost:8087/swagger-ui.html`

## 2. Các API chính

### A. Quản lý Hội thoại (`/api/v1/conversations`)
- `GET /api/v1/conversations?userId={id}`: Lấy danh sách cuộc trò chuyện của một người dùng.
- `GET /api/v1/conversations/{id}`: Lấy chi tiết cuộc trò chuyện và lịch sử tin nhắn.
- `POST /api/v1/conversations`: Khởi tạo cuộc trò chuyện mới hoặc lấy cuộc trò chuyện trực tiếp sẵn có.
- `GET /api/v1/conversations/{id}/messages`: Lấy toàn bộ tin nhắn trong cuộc trò chuyện (sắp xếp tăng dần theo thời gian).
- `POST /api/v1/conversations/{id}/messages`: Gửi tin nhắn mới vào cuộc trò chuyện.
- `PATCH /api/v1/conversations/{id}/close`: Đóng cuộc trò chuyện.

### B. Quản lý Thông báo (`/api/v1/notifications`)
- `GET /api/v1/notifications?userId={id}`: Lấy danh sách thông báo của người dùng.
- `GET /api/v1/notifications/unread-count?userId={id}`: Đếm số lượng thông báo chưa đọc.
- `PATCH /api/v1/notifications/{id}/read`: Đánh dấu thông báo đã đọc.

### C. WebSocket STOMP
- Endpoint: `/ws-chat`
- Broadcast Topic: `/topic/conversations/{conversationId}`
