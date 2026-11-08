# 🏛️ TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM DESIGN SPECIFICATION)
## DỰ ÁN: NỀN TẢNG THUÊ PLOT VÀ THEO DÕI TRẢI NGHIỆM CANH TÁC (AGRITECH PLATFORM)
> **Môn học:** ISP392 – Information System Programming Project  
> **Kiến trúc tham chiếu:** Dựa trên chuẩn **System Design Primer** (Donne Martin)  
> **Phiên bản:** 2.0 (Chuẩn hóa toàn diện phạm vi dự án – Kiến trúc AI Chatbot & Event-Driven Workers)  
> **Sơ đồ kiến trúc:** [`docs/diagrams/06_System_Architecture_Primer.png`](../diagrams/06_System_Architecture_Primer.png) | [`docs/diagrams/06_System_Architecture_Primer.puml`](../diagrams/06_System_Architecture_Primer.puml)

---

## 📑 MỤC LỤC NỘI DUNG
1. [Tổng Quan Kiến Trúc & Bối Cảnh Dự Án](#1-tổng-quan-kiến-trúc--bối-cảnh-dự-án)
2. [Bước 1: Phạm Vi, Use Cases & Ước Tính Năng Lực (Capacity Estimation)](#2-bước-1-phạm-vi-use-cases--ước-tính-năng-lực-capacity-estimation)
3. [Bước 2: Sơ Đồ Kiến Trúc Tổng Thể (High-Level Architecture Blueprint)](#3-bước-2-sơ-đồ-kiến-trúc-tổng-thể-high-level-architecture-blueprint)
4. [Bước 3: Áp Dụng Các Nguyên Lý Cốt Lõi Từ System Design Primer](#4-bước-3-áp-dụng-các-nguyên-lý-cốt-lõi-từ-system-design-primer)
   - [4.1. Định lý CAP & PACELC Trade-offs](#41-định-lý-cap--pacelc-trade-offs)
   - [4.2. Bài toán Trùng Lịch & Giữ Chỗ 15 Phút (Concurrency & Distributed Lock)](#42-bài-toán-trùng-lịch--giữ-chỗ-15-phút-concurrency--distributed-lock)
   - [4.3. Chiến Lược Bộ Đệm Đa Tầng (Multi-Level Caching & Redis Patterns)](#43-chiến-lược-bộ-đệm-đa-tầng-multi-level-caching--redis-patterns)
   - [4.4. Xử Lý Bất Đồng Bộ & Hàng Đợi Tác Vụ Nền (Asynchronous Task Queues - No AI Worker)](#44-xử-lý-bất-đồng-bộ--hàng-đợi-tác-vụ-nền-asynchronous-task-queues---no-ai-worker)
   - [4.5. Tầng Dữ Liệu Đa Mô Hình (Polyglot Persistence & Master-Slave Replication)](#45-tầng-dữ-liệu-đa-mô-hình-polyglot-persistence--master-slave-replication)
   - [4.6. Giao Tiếp Thời Gian Thực (Real-Time Communication: WebSocket/STOMP)](#46-giao-tiếp-thời-gian-thực-real-time-communication-websocketstomp)
   - [4.7. Kiến Trúc AI Chatbot 24/7 & Mô Hình RAG Nhẹ (Interactive AI Chatbot Architecture)](#47-kiến-trúc-ai-chatbot-247--mô-hình-rag-nhẹ-interactive-ai-chatbot-architecture)
5. [Bước 4: Bảo Mật, Tính Sẵn Sàng Cao & Idempotency](#5-bước-4-bảo-mật-tính-sẵn-sàng-cao--idempotency)
6. [Bước 5: Bảng Đối Chiếu Khái Niệm System Design Primer Với ISP392](#6-bước-5-bảng-đối-chiếu-khái-niệm-system-design-primer-với-isp392)
7. [Bước 6: Ngân Hàng Câu Hỏi Vấn Đáp Bảo Vệ Đồ Án (Viva Defense Q&A)](#7-bước-6-ngân-hàng-câu-hỏi-vấn-đáp-bảo-vệ-đồ-án-viva-defense-qa)

---

## 1. TỔNG QUAN KIẾN TRÚC & BỐI CẢNH DỰ ÁN

Hệ thống **Thuê Plot và Theo dõi Trải nghiệm Canh tác** là một nền tảng AgriTech phục vụ người dân đô thị thuê đất canh tác nông sản sạch tại trang trại tập trung. Hệ thống số hóa chu trình khép kín:
$$\text{Marketplace} \rightarrow \text{Consultation} \rightarrow \text{Reservation (15m)} \rightarrow \text{Payment} \rightarrow \text{Rental} \rightarrow \text{Cultivation} \rightarrow \text{Monitoring} \rightarrow \text{Harvest}$$

### Làm rõ phạm vi phân hệ AI trong dự án:
> [!IMPORTANT]
> **Hệ thống KHÔNG sử dụng AI Worker chạy ngầm để sinh quy trình hay phê duyệt canh tác.**  
> Kế hoạch canh tác (Cultivation Plan) được khởi tạo dựa trên **Standard Process Template (Quy trình chuẩn)** do Chuyên gia nông nghiệp (CGNN) cấu hình sẵn cho từng giống cây, sau đó CGNN trực tiếp tinh chỉnh và Khách hàng phê duyệt trước khi sinh Care Task cho Chuyên viên lao động (CVLĐ).  
> **Tính năng AI duy nhất của dự án là AI CHATBOT (SCR-KH-13, US8.4):** Một trợ lý ảo giao tiếp tương tác 24/7 dạng Floating Widget trên giao diện Khách hàng, đóng vai trò giải đáp thường thức về kỹ thuật làm vườn, chẩn đoán sơ bộ dựa trên kho tài liệu kỹ thuật, hoàn toàn phi trạng thái và không có quyền can thiệp vào nghiệp vụ cốt lõi hay cơ sở dữ liệu giao dịch.

### Thách thức kỹ thuật đặt ra:
1. **Bất đối xứng đọc/ghi (Read/Write Asymmetry):** Khách hàng duyệt tìm kiếm Plot và đọc nhật ký rất nhiều (Read-heavy), trong khi trạm cảm biến IoT và lao động thực địa đẩy dữ liệu đo lường/ảnh liên tục (Write-heavy).
2. **Xung đột giữ chỗ (Race Condition & Double Booking):** Hai khách hàng cùng bấm đặt một thửa đất (Plot) tại cùng một khoảng thời gian trong giờ cao điểm.
3. **Độ trễ dịch vụ bên ngoài (External Latency):** Phản hồi từ AI Chatbot (LLM API streaming), Cổng thanh toán (Webhook callback), và việc tải ảnh hiện trường độ phân giải cao gây nghẽn băng thông.
4. **Tính nhất quán dữ liệu hợp đồng tài chính (Financial Consistency) vs Tính sẵn sàng của dữ liệu môi trường (Sensor Availability).**

Tài liệu này chuẩn hóa toàn bộ thiết kế hệ thống của đồ án ISP392 theo các mẫu hình (architectural patterns) và nguyên tắc đánh đổi (trade-offs) đã được đúc kết từ **System Design Primer** của Donne Martin.

---

## 2. BƯỚC 1: PHẠM VI, USE CASES & ƯỚC TÍNH NĂNG LỰC (CAPACITY ESTIMATION)

Theo phương pháp luận của Donne Martin, bước đầu tiên trong thiết kế hệ thống là lượng hóa các chỉ số kỹ thuật (Back-of-the-envelope calculations).

### 2.1. Giả định nghiệp vụ (Assumptions & Scale)
* **Quy mô trang trại:** 500 Plots canh tác đang hoạt động.
* **Người dùng tích cực hàng ngày (DAU):** 10,000 người dùng (Khách hàng, Chuyên gia, Nhân viên, Quản trị viên).
* **Chu kỳ gửi cảm biến IoT (Mock IoT Stations):** Mỗi Plot gửi 1 gói telemetry (nhiệt độ, độ ẩm không khí, độ ẩm đất, ánh sáng) mỗi **30 giây**.
* **Tác vụ hiện trường & Nhật ký (Field Tasks & Diary):** Trung bình 2,000 lượt cập nhật tiến độ/nhật ký mỗi ngày, kèm theo 1–3 hình ảnh hiện trường (ảnh gốc ~2 MB).
* **Lưu lượng AI Chatbot (24/7 Gardening Q&A):** Khoảng 1,000 lượt tương tác hỏi đáp mỗi ngày từ khách thuê.
* **Tỷ lệ Đọc/Ghi (Read/Write Ratio):**
  * *Phân hệ Marketplace & Xem Plot:* Đọc : Ghi = **20 : 1** (Xem nhiều hơn đặt).
  * *Phân hệ Cảm biến IoT:* Đọc : Ghi = **1 : 10** (Dữ liệu đẩy vào liên tục theo chu kỳ thời gian, người dùng chỉ xem biểu đồ tổng hợp).

### 2.2. Tính toán lưu lượng & Băng thông (Traffic & Bandwidth Estimates)
* **IoT Ingestion Throughput:**
  $$\text{IoT Writes/sec} = \frac{500 \text{ plots}}{30 \text{ seconds}} \approx 16.7 \text{ writes/sec (WPS)}$$
  *Kích thước mỗi payload IoT JSON:* $\approx 250 \text{ bytes}$.  
  *Băng thông nhận IoT:* $16.7 \times 250 \text{ bytes} \approx 4.2 \text{ KB/sec}$ ($24/7$).
* **Marketplace API Requests (DAU 10,000):**
  * Mỗi người dùng trung bình thực hiện 30 requests/ngày $\rightarrow$ Tổng requests = $300,000 \text{ requests/ngày}$.
  * **Average QPS:** $\frac{300,000}{86,400} \approx 3.5 \text{ QPS}$.
  * **Peak QPS (giờ vàng):** Hệ số $\times 5 \rightarrow \approx \mathbf{20 - 50 \text{ QPS}}$.
* **Media Storage (Ảnh Nhật ký & Ảnh Minh chứng Task):**
  * $2,000 \text{ tasks/ngày} \times 2 \text{ ảnh/task} = 4,000 \text{ ảnh/ngày}$.
  * Dung lượng sau nén WebP ($300 \text{ KB/ảnh}$): $4,000 \times 300 \text{ KB} = 1.2 \text{ GB/ngày} \approx 36 \text{ GB/tháng}$.
  * *Kết luận:* Sử dụng **Object Storage (S3 / MinIO)** kết hợp **CDN**, tuyệt đối không lưu file nhị phân trực tiếp vào cơ sở dữ liệu quan hệ (RDBMS).

---

## 3. BƯỚC 2: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ (HIGH-LEVEL ARCHITECTURE BLUEPRINT)

Hệ thống được thiết kế theo mô hình **Tầng dịch vụ phi trạng thái (Stateless Multi-Tier Architecture)** chuẩn hóa từ System Design Primer:

```
[Clients: KH (Web + Chatbot Widget) / CGNN / CVLD / AD / IoT Mock]
                                │
                                ▼
                        [DNS / Route 53]
                         │            │
             (Static / Media)      (Dynamic API)
                         │            │
                         ▼            ▼
                  [CDN: Cloudflare] [NGINX L7 Reverse Proxy & Load Balancer]
                         │            │
                         │            ▼
                         │     [API Gateway & Spring Security (JWT)]
                         │            │
                         │     ┌──────┴──────────────────────────┐
                         │     ▼                                 ▼
                         │  [Stateless Web/App Services]    [WebSocket Hub (STOMP)]
                         │  - Marketplace & Rental           - Realtime Chat KH ↔ CGNN
                         │  - Agronomy & Plan Management     - Live IoT Sensor Stream
                         │  - Field Ops & Task Dispatch
                         │  - AI Chatbot Service (SCR-KH-13) ──► [External LLM API]
                         │     │                │                 (Gemini / OpenAI)
                         │     ├────────────────┼────────────────────────┐
                         │     ▼                ▼                        ▼
                         │  [Cache & Lock]   [Async Task Queue]     [Data Persistence Layer]
                         │  Redis Cluster    RabbitMQ / Streams     ┌────────────────────────┐
                         │  - Plot Catalog   - 15m Lock Timeout     │ Primary RDBMS (Master) │
                         │  - SET NX EX Lock - IoT Threshold Alert  │ (PostgreSQL/MySQL)     │
                         │  - Token Bucket   - Image Compressor     └───────────┬────────────┘
                         │                   - Notifications                    │ (Async Replication)
                         │                                                      ▼
                         │                                          ┌────────────────────────┐
                         │                                          │ Read-Replica DB(Slave) │
                         │                                          └────────────────────────┘
                         │                                          ┌────────────────────────┐
                         │                                          │ Time-Series (Sensors)  │
                         │                                          └────────────────────────┘
                         ▼                                          ┌────────────────────────┐
              [Object Storage (MinIO / S3)] ◄───────────────────────┤ S3 Bucket for Media    │
                                                                    └────────────────────────┘
```

### Các thành phần chính trong bản thiết kế:
1. **Edge Tier:** Cloudflare CDN lưu trữ hình ảnh Plot, avatar, tài liệu quy trình canh tác chuẩn; giảm 70% tải truy vấn tĩnh về máy chủ gốc.
2. **Reverse Proxy & Load Balancer (NGINX):** Đóng vai trò Reverse Proxy, SSL Termination (HTTPS), Gzip/Brotli compression, và Rate Limiting bảo vệ các endpoint nhạy cảm (Đăng nhập, Tạo đơn giữ chỗ).
3. **Application Tier (Spring Boot / MVC Stateless):** Các controller xử lý logic không lưu trạng thái phiên (session) trong bộ nhớ cục bộ mà xác thực qua **JWT stateless**; cho phép dễ dàng mở rộng theo chiều ngang (Horizontal Scaling).
4. **AI Chatbot Service (SCR-KH-13):** Module giao tiếp thời gian thực kết nối với LLM Provider (Google Gemini / OpenAI) qua giao thức HTTP Streaming (Server-Sent Events - SSE), hỗ trợ khách hàng hỏi đáp tức thì với độ trễ phản hồi ký tự đầu tiên $<500\text{ms}$.
5. **Caching & Distributed Lock (Redis):** Tăng tốc đọc danh mục Plot và quản lý khóa phân tán chống trùng đơn đặt.
6. **Message Broker & Background Workers (RabbitMQ):** Tiếp nhận các tác vụ nền nặng: quét đơn hết hạn 15 phút, nén ảnh hiện trường, kiểm tra ngưỡng cảnh báo môi trường IoT và gửi thông báo.
7. **Polyglot Persistence Layer:** Phân định rõ ràng: RDBMS cho nghiệp vụ giao dịch ACID, Time-series table cho IoT, Object storage cho ảnh hiện trường.

---

## 4. BƯỚC 3: ÁP DỤNG CÁC NGUYÊN LÝ CỐT LÕI TỪ SYSTEM DESIGN PRIMER

### 4.1. Định lý CAP & PACELC Trade-offs

Định lý CAP chỉ ra rằng trong một hệ thống phân tán khi xảy ra phân mảnh mạng (**Partition Tolerance - P**), chúng ta chỉ có thể chọn giữa **Tính nhất quán (Consistency - C)** hoặc **Tính sẵn sàng (Availability - A)**.

Trong dự án ISP392, chúng ta áp dụng chiến lược **Hybrid CAP**:

```
                  ┌────────────────────────────────────────┐
                  │          CAP THEOREM IN ISP392         │
                  └────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
 ┌─────────────────────────────┐                     ┌─────────────────────────────┐
 │    CP (Consistency Focus)   │                     │   AP (Availability Focus)   │
 ├─────────────────────────────┤                     ├─────────────────────────────┤
 │ • Marketplace & Reservation │                     │ • IoT Sensor Telemetry      │
 │ • Rental Contract & Payment │                     │ • Farm Diary Browse/Read    │
 │ • Field Task Status Update  │                     │ • Real-time Chat Messages   │
 ├─────────────────────────────┤                     ├─────────────────────────────┤
 │ Nếu mạng phân mảnh, thà     │                     │ Nếu mạng phân mảnh, ưu tiên │
 │ từ chối request (fail-fast) │                     │ nhận dữ liệu và trả kết quả │
 │ còn hơn bán trùng 1 Plot    │                     │ nhanh; chấp nhận trễ gói tin│
 │ cho 2 người (Double Booking)│                     │ (Eventual Consistency).     │
 └─────────────────────────────┘                     └─────────────────────────────┘
```

* **Quy tắc PACELC:** Khi mạng bình thường (Else):
  * Với Thanh toán/Giữ chỗ: Ưu tiên **Consistency** hơn Latency (Chấp nhận đợi lock DB/Redis để đảm bảo không bị xung đột).
  * Với IoT Dashboard: Ưu tiên **Latency** hơn Consistency (Trả về số đo gần nhất trong cache Redis thay vì bắt client chờ quét toàn bộ bảng DB).

---

### 4.2. Bài toán Trùng Lịch & Giữ Chỗ 15 Phút (Concurrency & Distributed Lock)

#### Vấn đề nghiệp vụ:
Khách hàng chọn Plot #05 từ ngày `01/10/2026` đến `30/11/2026`. Sau khi nhấn "Đặt chỗ", hệ thống cho phép 15 phút để hoàn tất thanh toán. Trong 15 phút này, không ai khác được quyền đặt trùng vào khoảng thời gian đó. Nếu sau 15 phút không thanh toán, Plot phải tự động mở khóa.

#### So sánh 3 giải pháp từ System Design Primer:

| Tiêu chí | 1. Pessimistic Lock (`SELECT FOR UPDATE`) | 2. Optimistic Lock (`@Version`) | 3. Redis Distributed Lock (`SET NX EX`) ⭐ |
| :--- | :--- | :--- | :--- |
| **Cơ chế** | Khóa dòng trong DB đến khi commit transaction. | Kiểm tra số phiên bản khi update, rollback nếu xung đột. | Khóa trên RAM với thời gian sống (TTL = 900s). |
| **Ưu điểm** | Đảm bảo tính nhất quán tuyệt đối trong DB. | Không gây nghẽn kết nối DB khi đọc. | Cực nhanh, tự giải phóng khi hết 15 phút không cần cronjob quét DB. |
| **Nhược điểm** | Chiếm dụng Connection Pool DB; không giữ khóa được 15 phút cho thanh toán người dùng. | Bị Retry nhiều lần khi lượng truy cập cao; không giải quyết được bài toán chờ 15 phút. | Cần cài đặt Redis; cần xử lý trường hợp Redis sập (Redlock pattern). |

#### Thiết kế triển khai chuẩn (Multi-layer Defense):

```java
// Bước 1: Giành khóa phân tán trên Redis (TTL 15 phút = 900 giây)
String lockKey = "lock:plot:" + plotId + ":reservation";
String clientToken = UUID.randomUUID().toString();
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, clientToken, 15, TimeUnit.MINUTES);

if (!Boolean.TRUE.equals(acquired)) {
    throw new PlotAlreadyReservedException("Mảnh đất đang được người khác giữ chỗ, vui lòng thử lại sau!");
}

// Bước 2: Lưu Reservation vào RDBMS với trạng thái PENDING
try {
    Reservation reservation = new Reservation();
    reservation.setPlotId(plotId);
    reservation.setUserId(currentUserId);
    reservation.setStatus(ReservationStatus.PENDING);
    reservation.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
    reservationRepository.save(reservation);
    
    // Đẩy thông điệp vào Delayed Message Queue để tự động kiểm tra sau 15 phút
    messageProducer.sendDelayedCheck("reservation.timeout.queue", reservation.getId(), 15 * 60 * 1000);
} catch (Exception ex) {
    // Nếu ghi DB lỗi, lập tức hoàn trả khóa Redis
    redisTemplate.delete(lockKey);
    throw ex;
}
```

---

### 4.3. Chiến Lược Bộ Đệm Đa Tầng (Multi-Level Caching & Redis Patterns)

Áp dụng mô hình **Cache-Aside Pattern** (Lazy Loading) từ Primer cho danh mục Plot và thông tin giống rau (Crop/Variety):

```
Application  ────── 1. Query Cache ──────►  [Redis Cache]
    │                                              │
    │ (Cache Miss)                                 │ (Cache Hit)
    ▼                                              ▼
[PostgreSQL DB] ◄── 2. Query Database ─────────────┘
    │
    └────────────── 3. Write back to Cache with TTL (30 mins)
```

#### Xử lý các rủi ro kinh điển của Caching:
1. **Cache Stampede / Breakdown (Nhiều request cùng tràn vào khi key hết hạn):**
   * Sử dụng **Mutual Exclusion Lock (Mutex)** trên Redis: Chỉ 1 request đầu tiên được gọi xuống Database để làm mới cache, các requests còn lại chờ 50ms rồi lấy dữ liệu từ cache mới.
2. **Cache Penetration (Hacker quét các ID không tồn tại để đánh sập DB):**
   * Áp dụng **Bloom Filter** hoặc lưu giá trị `NULL` vào Redis với TTL ngắn (60 giây) cho các ID không tìm thấy.
3. **Cache Avalanche (Hàng nghìn Plot cùng hết hạn cache vào 1 thời điểm):**
   * Bổ sung **Randomized TTL Jitter**: $TTL = 1800 \text{s} + \text{random}(0, 300)\text{s}$.

---

### 4.4. Xử Lý Bất Đồng Bộ & Hàng Đợi Tác Vụ Nền (Asynchronous Task Queues - No AI Worker)

Việc chuyển các tác vụ nền nặng ra khỏi luồng xử lý chính (Request-Response cycle) giúp giảm độ trễ API từ hàng giây xuống còn dưới **50ms**.

> [!NOTE]
> Hệ thống phân bổ **4 Hàng đợi Tác vụ Nền cụ thể** trên RabbitMQ / Redis Streams. Không có "AI Worker" trong hàng đợi này vì AI Chatbot giao tiếp trực tiếp qua HTTP Streaming:

```
[Web App Request / IoT Event] ──(Publish Event)──► [Message Broker (RabbitMQ)]
                                                             │
       ┌────────────────────┬────────────────────────────────┼────────────────────┐
       ▼                    ▼                                ▼                    ▼
[Delayed TTL Queue]   [Media Queue]                   [IoT Alert Queue]    [Notification Queue]
       │                    │                                │                    │
       ▼                    ▼                                ▼                    ▼
[Worker: Auto-Cancel  [Worker: Nén ảnh,               [Worker: Đối chiếu   [Worker: Bắn push,
  đơn sau 15 phút       tạo thumbnail,                  ngưỡng min/max &     gửi Email cho
  nếu chưa thanh toán]  lưu vào MinIO/S3]               sinh cảnh báo IoT]   Khách & Chuyên viên]
```

1. **Auto-Cancellation Worker:** Khi khách hàng không thanh toán sau 15 phút, worker kích hoạt đổi trạng thái `Reservation` sang `EXPIRED`, giải phóng khóa Redis và cập nhật trạng thái Plot về `AVAILABLE`.
2. **Media Pipeline Worker:** Lao động thực địa tải ảnh gốc 5 MB từ điện thoại lên; worker tự động resize về chuẩn WebP 1080p, đóng dấu watermark (Thời gian + Mã Task), rồi tải lên Object Storage (MinIO / S3).
3. **IoT Environmental Alert Worker (US4.5):** Nhận sự kiện telemetry từ trạm đo, so sánh với ngưỡng `min/max` (nhiệt độ, độ ẩm không khí, độ ẩm đất) của giai đoạn sinh trưởng hiện tại do Chuyên gia cấu hình; nếu vượt ngưỡng sẽ sinh `EnvironmentalAlert` và kích hoạt thông báo khẩn.
4. **Notification Dispatcher Worker:** Gửi thông báo đẩy (In-app notification), Email kích hoạt tài khoản, Email nhắc ngày thu hoạch cho Khách hàng và Chuyên viên.

---

### 4.5. Tầng Dữ Liệu Đa Mô Hình (Polyglot Persistence & Master-Slave Replication)

Thay vì cố gắng nhồi nhét tất cả vào một cơ sở dữ liệu duy nhất, hệ thống phân bổ theo đặc thù dữ liệu:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POLYGLOT PERSISTENCE LAYER                         │
├──────────────────────┬───────────────────────────────┬──────────────────────┤
│ Loại Dữ Liệu         │ Công Nghệ Đề Xuất             │ Lý Do Lựa Chọn       │
├──────────────────────┼───────────────────────────────┼──────────────────────┤
│ Users, Plots,        │ PostgreSQL / MySQL            │ Cần tính toàn vẹn    │
│ Rentals, Contracts,  │ (Master-Slave Replication)    │ tham chiếu (FK),     │
│ Tasks, Payments      │ • Master: Ghi giao dịch       │ chuẩn hóa ACID,      │
│                      │ • Slave: Đọc tìm kiếm & báo cáo│ transaction an toàn. │
├──────────────────────┼───────────────────────────────┼──────────────────────┤
│ Cảm biến IoT         │ PostgreSQL + TimescaleDB      │ Dữ liệu chuỗi thời   │
│ (Nhiệt độ, Độ ẩm đất,│ extension hoặc bảng phân vùng  │ gian (append-only),  │
│ Độ ẩm khí, Ánh sáng) │ (Table Partitioning by Month) │ nén cao, truy vấn    │
│                      │                               │ đồ thị theo giờ/ngày.│
├──────────────────────┼───────────────────────────────┼──────────────────────┤
│ Hình ảnh hiện trường,│ MinIO / AWS S3                │ Tối ưu lưu trữ file  │
│ Hợp đồng điện tử,    │ (Gắn kết CDN Cloudflare)      │ nhị phân, giảm tải   │
│ Tài liệu hướng dẫn   │                               │ I/O đĩa cho DB chính.│
└──────────────────────┴───────────────────────────────┴──────────────────────┘
```

#### Tối ưu hóa truy vấn SQL (Database Indexing Strategy):
* Đánh B-Tree Index phức hợp trên `rentals(plot_id, start_date, end_date, status)` để phục vụ thuật toán kiểm tra chống trùng lịch tức thì.
* Đánh Index trên `tasks(assigned_staff_id, status, scheduled_date)` cho màn hình công việc của Chuyên viên lao động.
* Sử dụng **BRIN Index (Block Range Index)** trên trường `timestamp` của bảng đo lường cảm biến IoT, giúp tiết kiệm 90% dung lượng index so với B-Tree thông thường trên hàng triệu bản ghi đo đạc.

---

### 4.6. Giao Tiếp Thời Gian Thực (Real-Time Communication: WebSocket/STOMP)

Thay vì để máy khách gửi Polling liên tục (gây lãng phí tài nguyên và làm nghẽn CPU), hệ thống sử dụng **WebSocket** với sub-protocol **STOMP**:
* **Kênh tư vấn Khách hàng ↔ Chuyên gia (US8.1, US8.2):** `/topic/consultation/{sessionId}` (Tin nhắn gửi nhận tức thì).
* **Kênh trao đổi kỹ thuật CVLĐ ↔ CGNN (US8.3):** `/topic/issues/{issueId}` (Báo cáo sự cố sâu bệnh, hỏng hóc hiện trường).
* **Kênh giám sát IoT Live:** `/topic/plot/{plotId}/telemetry` (Trạm IoT bắn dữ liệu mới, dashboard của khách tự động nhảy số đo mà không cần tải lại trang).
* **Kênh điều phối công việc hiện trường:** `/user/{staffId}/queue/tasks` (Thông báo task mới được giao ngay trên điện thoại của nhân viên thực địa).

---

### 4.7. Kiến Trúc AI Chatbot 24/7 & Mô Hình RAG Nhẹ (Interactive AI Chatbot Architecture)

Dựa trên **SCR-KH-13** và **US8.4**, AI trong hệ thống được định nghĩa chặt chẽ là **AI Chatbot**:

```
[Khách Hàng (SCR-KH-13)] 
        │ 
        │ 1. Gửi câu hỏi làm vườn ("Rau muống bị vàng lá thì xử lý sao?")
        ▼
[AI Chatbot Controller (Spring Web)]
        │ 
        │ 2. Truy vấn tài liệu kỹ thuật liên quan (RAG Context)
        ▼
[Agronomy Doc Store (PostgreSQL / Read Replica)]
        │ 
        │ 3. Tạo Prompt kèm Context & System Instructions
        ▼
[External LLM Provider: Google Gemini / OpenAI]
        │ 
        │ 4. Phản hồi Streaming (Server-Sent Events - SSE)
        ▼
[Giao diện Chat Khách Hàng (Từng ký tự xuất hiện mượt mà <500ms)]
```

#### Các nguyên tắc thiết kế cho AI Chatbot:
1. **Giao tiếp tương tác trực tiếp (Synchronous / Streaming SSE):** Khách hàng chat cần nhận phản hồi ngay lập tức, do đó AI Chatbot không đi qua hàng đợi tác vụ nền (Message Queue) mà kết nối trực tiếp với LLM API qua HTTP Streaming.
2. **Retrieval-Augmented Generation (RAG nhẹ):** Tham chiếu kho tài liệu kỹ thuật chuyên môn (`ProfessionalSourceDocument` do CGNN tải lên - US4.6) để làm giàu ngữ cảnh câu hỏi, giúp câu trả lời sát thực tế nông trại Việt Nam và chính xác hơn.
3. **Ranh giới an toàn & Pháp lý (Safety & Business Boundary):**
   * Luôn đính kèm Disclaimer: *"Thông tin do AI đề xuất mang tính tham khảo. Hãy liên hệ Chuyên gia nông nghiệp (CGNN) khi cần chẩn đoán chính xác."* (US8.4).
   * **AI Chatbot hoàn toàn phi quyền hạn (Read-only):** Không được quyền tự sửa kế hoạch canh tác, không tự tạo task, không thao tác vào tài chính hay dữ liệu thuê đất.

---

## 5. BƯỚC 4: BẢO MẬT, TÍNH SẴN SÀNG CAO & IDEMPOTENCY

### 5.1. Xác thực & Phân quyền (Stateless JWT with Blacklist)
* Cơ chế **Access Token (15 phút)** + **Refresh Token (7 ngày)**.
* **Token Invalidation:** Khi người dùng đổi mật khẩu hoặc đăng xuất, `jti` (JWT ID) được đưa vào Redis Blacklist với TTL bằng thời gian sống còn lại của Token.
* **RBAC chặt chẽ:** 4 Roles (`ROLE_CUSTOMER`, `ROLE_EXPERT`, `ROLE_STAFF`, `ROLE_ADMIN`) được lọc tại Spring Security Filter Chain trước khi chạm đến Business Logic.

### 5.2. Tính Bất Biến trong Thanh Toán (Payment Idempotency)
Để phòng ngừa việc người dùng nhấn nút "Thanh toán" hai lần liên tiếp hoặc mạng lag gửi lặp request:
* Client sinh một `Idempotency-Key` (UUIDv4) gắn vào Header request thanh toán.
* Backend kiểm tra trong Redis: Nếu `Idempotency-Key` đang xử lý hoặc đã hoàn tất, trả ngay kết quả cũ mà không gọi lại dịch vụ thanh toán.

### 5.3. Giới hạn Tần suất Truy cập (Rate Limiting)
Triển khai thuật toán **Token Bucket** trên tầng NGINX / Gateway:
* `/api/v1/auth/login`: Tối đa 5 requests / phút / IP (Chống Brute-force mật khẩu).
* `/api/v1/rentals/reserve`: Tối đa 3 requests / phút / User (Chống bot spam giữ chỗ Plot).
* `/api/v1/chatbot/ask`: Tối đa 15 câu hỏi / phút / User (Chống lạm dụng chi phí token LLM API).
* `/api/v1/iot/telemetry`: Tối đa 2 requests / phút / Station.

---

## 6. BƯỚC 5: BẢNG ĐỐI CHIẾU KHÁI NIỆM SYSTEM DESIGN PRIMER VỚI ISP392

| Chủ đề trong System Design Primer | Nguyên lý / Giải pháp | Áp dụng cụ thể vào Đồ án ISP392 |
| :--- | :--- | :--- |
| **DNS & CDN** | Caching nội dung tĩnh gần người dùng | Cloudflare CDN lưu ảnh Plot, giống rau, ảnh nhật ký canh tác. |
| **Load Balancer** | L7 Reverse Proxy, SSL Termination | NGINX cân bằng tải, nén Gzip, kiểm tra Health-check. |
| **Microservices vs Monolith** | Modular Monolith / Stateless Web Tier | Tách biệt các module: Marketplace, Agronomy, Tasks, Telemetry, AI Chatbot. |
| **CAP Theorem** | Đánh đổi C và A khi có Partition mạng | Chọn **CP** cho Thuê Plot/Thanh toán; chọn **AP** cho Cảm biến IoT. |
| **Master-Slave Replication** | Tách luồng Đọc và Ghi trong RDBMS | Master xử lý đặt chỗ/thanh toán; Read Replica phục vụ Marketplace & RAG Docs. |
| **Database Sharding/Partitioning**| Phân vùng dữ liệu lớn theo thời gian | Table Partitioning theo tháng cho bảng dữ liệu cảm biến IoT. |
| **Cache-Aside Pattern** | Kiểm tra cache trước, miss mới gọi DB | Caching danh mục Plot và giống cây trong Redis với TTL 30 phút. |
| **Distributed Lock** | Tránh Race Condition phân tán | `SET NX EX` trên Redis giữ chỗ thửa đất 15 phút chống đặt trùng. |
| **Message Queues** | Xử lý bất đồng bộ & giải phóng tải | RabbitMQ cho Tự hủy đơn 15 phút, Cảnh báo ngưỡng IoT, Nén ảnh, Thông báo. |
| **WebSockets** | Giao tiếp 2 chiều độ trễ thấp | STOMP over WebSocket cho phòng chat tư vấn & giám sát IoT live. |
| **AI Integration** | Interactive Assistant with Streaming | AI Chatbot (SCR-KH-13) gọi LLM API streaming, không dùng AI worker ngầm. |
| **Object Storage** | Lưu trữ phi cấu trúc quy mô lớn | MinIO / S3 lưu trữ ảnh hiện trường thay vì lưu Blob trong DB. |

---

## 7. BƯỚC 6: NGÂN HÀNG CÂU HỎI VẤN ĐÁP BẢO VỆ ĐỒ ÁN (VIVA DEFENSE Q&A)

Dưới đây là các câu hỏi kinh điển mà Giảng viên/Hội đồng chấm thi thường chất vấn sinh viên về Kiến trúc & Thiết kế hệ thống:

#### ❓ Câu 1: Làm thế nào hệ thống của bạn đảm bảo 2 khách hàng không bao giờ thuê trùng một mảnh đất trong cùng một khung ngày?
> **Trả lời:** Em áp dụng cơ chế phòng thủ 2 lớp (Two-tier Concurrency Defense):
> 1. **Lớp 1 (Fast-fail với Redis Distributed Lock):** Khi khách nhấn đặt chỗ, hệ thống gọi lệnh `SET lock:plot:{id}:{daterange} {userId} NX EX 900`. Nhờ tính đơn luồng (single-threaded) của Redis, chỉ một người duy nhất giành được khóa trong 15 phút.
> 2. **Lớp 2 (ACID Database Constraint):** Ở tầng lưu trữ, bảng `rentals` có điều kiện kiểm tra giao cắt thời gian `(start_date, end_date)` bằng câu lệnh SQL có kiểm tra trạng thái và áp dụng Isolation Level `READ COMMITTED` / `REPEATABLE READ`.

#### ❓ Câu 2: Trong dự án của em có ứng dụng AI không? AI hoạt động như thế nào và có can thiệp vào quy trình trồng trọt không?
> **Trả lời:** Trong hệ thống của nhóm em, **AI chỉ đóng vai trò duy nhất là AI CHATBOT (SCR-KH-13, US8.4)** hỗ trợ hỏi đáp kiến thức thường thức 24/7 cho Khách hàng.
> - Về mặt kiến trúc: AI Chatbot là một dịch vụ tương tác trực tiếp (interactive streaming), gọi đến LLM Provider (Google Gemini API) và tham chiếu kho tài liệu kỹ thuật của nông trại để trả lời nhanh.
> - Về mặt nghiệp vụ: **AI hoàn toàn không có worker chạy ngầm, không tự phê duyệt và không can thiệp vào quy trình canh tác.** Việc lập kế hoạch canh tác bắt buộc phải tuân theo **Standard Process Template** do Chuyên gia nông nghiệp (CGNN) cấu hình và kiểm soát theo nguyên lý Human-in-the-loop để đảm bảo an toàn sinh học và trách nhiệm chất lượng nông sản.

#### ❓ Câu 3: Tại sao các bạn không lưu hình ảnh nhật ký nông trại trực tiếp dưới dạng BLOB trong Database SQL?
> **Trả lời:** Theo khuyến nghị từ System Design Primer, lưu ảnh BLOB trong RDBMS gây phình to dung lượng bảng, làm chậm quá trình quét Index, làm tràn bộ đệm RAM của cơ sở dữ liệu (Buffer Pool) và tốn kém chi phí sao lưu (Backup/Restore). Bọn em tách biệt hoàn toàn: RDBMS chỉ lưu đường dẫn URL, còn dữ liệu nhị phân của ảnh được lưu trữ trên **Object Storage (MinIO / S3)** và phân phối qua **CDN** để tận dụng khả năng caching tại biên.

#### ❓ Câu 4: Dữ liệu cảm biến IoT gửi về liên tục 30 giây một lần. Nếu có 10,000 plots thì Database của bạn có bị sập vì quá tải ghi không?
> **Trả lời:** 
> - Thứ nhất, API nhận dữ liệu IoT được thiết kế phi trạng thái và đẩy sự kiện vào hàng đợi (Message Buffer / Redis Streams) thay vì ghi trực tiếp từng dòng vào bảng quan hệ.
> - Thứ hai, tầng dữ liệu lưu trữ cảm biến áp dụng **Table Partitioning theo thời gian** (hoặc TimescaleDB). Dữ liệu này là `Append-only` nên tốc độ ghi cực kỳ cao. Sau 30 ngày, hệ thống tự động tổng hợp số liệu trung bình theo giờ (Downsampling) và nén lưu trữ lạnh (Cold Storage) để giải phóng đĩa cứng.

#### ❓ Câu 5: Nếu người dùng đặt chỗ nhưng không thanh toán thì làm sao mảnh đất mở lại cho người khác thuê?
> **Trả lời:** Em sử dụng cơ chế **Delayed Message Queue** (RabbitMQ Dead Letter Exchange - DLX). Khi tạo đơn giữ chỗ, hệ thống phát một thông điệp có TTL = 15 phút. Sau 15 phút, message rơi vào hàng đợi xử lý hết hạn; Worker kiểm tra nếu trạng thái đơn vẫn là `PENDING` thì tự động cập nhật `EXPIRED`, xóa khóa Redis và đưa trạng thái Plot về `AVAILABLE`. Cách làm này triệt tiêu hoàn toàn nhu cầu phải chạy vòng lặp Cronjob quét liên tục toàn bộ Database.

---

> 💡 **Tài liệu tham khảo chi tiết:**
> * Toàn bộ mã nguồn và lý thuyết gốc đã được tích hợp trong thư mục [`references/system-design-primer/`](../../references/system-design-primer/README.md).
> * Sơ đồ PlantUML trực quan: [`docs/diagrams/06_System_Architecture_Primer.puml`](../diagrams/06_System_Architecture_Primer.puml).
