# 🎨 FIGMA DESIGN SYSTEM & PROTOTYPE SPECIFICATION
## Dự án: Nền Tảng Thuê Plot & Theo Dõi Trải Nghiệm Canh Tác (AgriTech Platform)
> **Môn học:** ISP392 – Information System Programming Project  
> **Phiên bản:** 2.1 (Đồng bộ hoàn toàn với `screen-description.md` và `research-proposal.md`)  
> **File prototype tương tác HTML trực tiếp:** [`docs/prototype/index.html`](index.html)

---

## 📑 MỤC LỤC
1. [Tổng Quan Bản Vẽ Prototype](#1-tổng-quan-bản-vẽ-prototype)
2. [Hệ Thống Design Tokens (Bảng Mã Màu & Typography)](#2-hệ-thống-design-tokens)
3. [Quy Chuẩn Grid & Khung Hình (Frame Presets)](#3-quy-chuẩn-grid--khung-hình)
4. [Thư Viện Components Cốt Lõi (UI Component Library)](#4-thư-viện-components-cốt-lõi)
5. [Đặc Tả Kịch Bản & Luồng Tương Tác (Prototype User Flows)](#5-đặc-tả-kịch-bản--luồng-tương-tác)
6. [Hướng Dẫn Sử Dụng & Trình Chiếu Khảo Thí](#6-hướng-dẫn-sử-dụng--trình-chiếu-khảo-thí)

---

## 1. TỔNG QUAN BẢN VẼ PROTOTYPE

Bản vẽ Prototype của dự án được xây dựng dựa trên danh mục **47 màn hình** từ tài liệu `docs/requirements/screen-description.md`, tập trung mô phỏng trọn vẹn chu trình trải nghiệm người dùng khép kín:
$$\text{Marketplace} \rightarrow \text{Plot Details} \rightarrow \text{15m Lock Reservation} \rightarrow \text{100\% Upfront Payment} \rightarrow \text{IoT Dashboard} \rightarrow \text{Field Staff Tasks} \rightarrow \text{AI Chatbot}$$

Tệp nguyên mẫu tương tác độc lập đã được lập trình hoàn chỉnh tại [`docs/prototype/index.html`](index.html), tích hợp sẵn:
* **Figma Top Bar:** Chuyển đổi linh hoạt giữa 4 vai trò (**Khách hàng - KH**, **Chuyên gia - CGNN**, **Lao động - CVLĐ**, **Quản trị - AD**).
* **Figma Hotspot Hinting:** Đèn xung viền xanh chỉ dẫn các vùng bấm có tương tác.
* **Device Switcher:** Xem giao diện chuẩn **Desktop 1440px** hoặc **Mobile 390px (iPhone Frame)** cho chuyên viên hiện trường.
* **Live Micro-interactions:** Đếm ngược thời gian giữ chỗ 15 phút (Redis Lock simulation), tính giá động theo hình thức canh tác (Self-growing vs Assisted-growing), giả lập camera chụp ảnh nghiệm thu (BR15), và khung chat AI RAG 24/7.

---

## 2. HỆ THỐNG DESIGN TOKENS

### 2.1. Bảng Màu Thương Hiệu (Color Palette)

Hệ màu được thiết kế theo phong cách **AgriTech Modern & Clean Nature**, kết hợp giữa sắc xanh nông nghiệp sinh thái, sắc nâu đất ấm áp và các màu chức năng kiểm soát trạng thái giao dịch:

| Token Name | Hex Code | Ứng Dụng Trong Thiết Kế UI |
| :--- | :---: | :--- |
| **`agri-950`** (Forest Dark) | `#052E16` | Màu nền Header, thanh điều hướng chính, Text tiêu đề H1 lớn |
| **`agri-900`** (Deep Pine) | `#14532D` | Banner nổi bật của Hợp đồng thuê Active, khung chat AI |
| **`agri-700`** (Leaf Green) | `#15803D` | Giá thuê nổi bật, điểm nhấn trạng thái tối ưu |
| **`agri-600`** (Primary Brand) | `#16A34A` | **Màu thương hiệu chính:** Nút hành động chính (Primary CTA), Tabs đang chọn, Toggle switch |
| **`agri-100`** (Mint Soft) | `#DCFCE7` | Nền Badge "Sẵn sàng thuê", "Đang hoạt động", Tag cây trồng |
| **`soil-900`** (Rich Earth) | `#78350F` | Nhãn phân khu đất, thông tin thổ nhưỡng chuyên sâu |
| **`soil-500`** (Amber Harvest) | `#F59E0B` | **Trạng thái cảnh báo:** Cảnh báo 15m Lock hết hạn, SLA 48h, nút khẩn cấp |
| **`soil-50`** (Warm Sand) | `#FFFBEB` | Nền thông báo giữ chỗ 15 phút, thẻ lưu ý hợp đồng |
| **`surface-canvas`** | `#F8FAFC` | Nền tổng thể trang ứng dụng (App background) |
| **`border-subtle`** | `#E2E8F0` | Đường viền thẻ Plot, bảng dữ liệu, đường ngăn cách danh mục |

### 2.2. Thang Typography (Type Scale)

* **Font chữ chủ đạo:** `Plus Jakarta Sans` (hiện đại, bo tròn tinh tế) kết hợp `Inter` (rõ ràng, tối ưu hiển thị số đo kỹ thuật) và `JetBrains Mono` (dành cho số đo IoT, mã thửa đất và bộ đếm thời gian).

| Kiểu Chữ (Style) | Size / Line-height | Weight | Ví Dụ Ứng Dụng |
| :--- | :---: | :---: | :--- |
| **Display H1** | 28px / 36px | Black (900) | Tên thửa đất màn hình chi tiết, Tiêu đề Landing Page |
| **Heading H2** | 20px / 28px | ExtraBold (800) | Tiêu đề khối Marketplace, Tên hợp đồng đang canh tác |
| **Heading H3** | 14px / 20px | Bold (700) | Tiêu đề thẻ Plot (#L01-P02), Tiêu đề thẻ tác vụ hôm nay |
| **Body Base** | 13px / 18px | Regular (400) | Đoạn văn mô tả chất đất, nội dung hướng dẫn kỹ thuật |
| **Body Small** | 11px / 16px | Medium (500) | Chú thích cảm biến IoT, định lượng vật tư |
| **Data Mono** | 13px / 18px | Bold (700) | Số đo vi khí hậu (`68.2%`, `28.5°C`), Đếm ngược (`14:52`) |

---

## 3. QUY CHUẨN GRID & KHUNG HÌNH (FRAME PRESETS)

### 3.1. Desktop Artboard (Dành cho KH, CGNN, AD)
* **Kích thước Artboard:** `1440 x 960 px` (Khung hiển thị trình duyệt chuẩn).
* **Grid Layout:** 12-Column Responsive Grid.
  * *Margin:* 80px (hai bên lề).
  * *Gutter:* 24px (khoảng cách giữa các cột).
  * *Column Width:* 80px.

### 3.2. Mobile Artboard (Dành cho CVLĐ - Chuyên viên hiện trường)
* **Kích thước Artboard:** `390 x 844 px` (Chuẩn iPhone 14/15/16).
* **Grid Layout:** 4-Column Mobile Grid.
  * *Margin:* 16px.
  * *Gutter:* 12px.
  * *Hit Target tối thiểu:* 44 x 44 px (đảm bảo nhân viên đeo găng tay lao động vẫn thao tác thuận tiện).

---

## 4. THƯ VIỆN COMPONENTS CỐT LÕI (UI COMPONENT LIBRARY)

### 4.1. Thẻ Thửa Đất (Plot Card Component - SCR-KH-02)
* **Kích thước:** `320 x 420 px`, Bo góc `16px`, Viền `1.5px solid #E2E8F0`.
* **Thành phần:**
  1. *Cover Image (Ratio 16:9):* Ảnh thực tế độ phân giải cao kèm Tag trạng thái nổi (`Published`, `Reserved`, `Maintenance`).
  2. *Badge Vị trí:* Ghim góc dưới ảnh (`Khu A · Lô 01`).
  3. *Tên & Diện tích:* `#L01-P02` (Font Black 14px) + Badge diện tích `25 m²`.
  4. *Compatible Crops Tags:* Danh mục các giống rau tương thích (màu xanh lá nhạt).
  5. *IoT Micro-dashboard:* 3 chỉ số vi khí hậu thu nhỏ (Độ ẩm đất %, Nhiệt độ °C, pH đất).
  6. *Footer Card:* Đơn giá thuê (`1.200.000 đ/tháng`) và nút CTA `Chi tiết →`.

### 4.2. Bộ Đo Vi Khí Hậu IoT (IoT Telemetry Gauge Card)
* **Kích thước:** `180 x 100 px`, Bo góc `14px`.
* **Biến thể trạng thái (Variants):**
  * *Safe Zone (Xanh lục):* Độ ẩm đất 60% – 80%, Nhiệt độ 22°C – 32°C.
  * *Warning Zone (Hổ phách):* Độ ẩm đất 50% – 60% (kích hoạt cảnh báo tưới bổ sung).
  * *Danger Zone (Đỏ):* Độ ẩm đất < 45% kéo dài trên 60 phút (tự động phát sinh Emergency Care Task theo BR18).

### 4.3. Thanh Khóa Giữ Chỗ 15 Phút (15-Minute Reservation Lock Banner)
* **Hiệu ứng:** Dải Banner dính trên đỉnh màn hình (Sticky Top Banner), màu hổ phách đậm (`#78350F`), bộ đếm lùi `MM:SS`.
* **Badge nghiệp vụ:** Kèm nhãn `Grace Period: 3m` (Gia hạn thêm 3 phút khi chuyển sang cổng thanh toán tránh đứt kết nối OTP ngân hàng).

### 4.4. Thẻ Tác Vụ Lao Động Hiện Trường (Field Task Card - SCR-CVLD-01)
* **Kích thước:** Chiều rộng 100% Mobile, Bo góc `16px`, viền viền màu cam đất.
* **Thành phần:**
  * Thông tin luống đất & Tên công việc (`Bón thúc đợt 2: Phân trùn quế`).
  * Khối hướng dẫn kỹ thuật tóm tắt từ CGNN.
  * **Khu vực tải ảnh minh chứng bắt buộc (BR15):** Nút mở camera chụp ảnh thực địa $\ge 1$ ảnh kèm preview thu nhỏ.
  * Nút `Xác nhận hoàn thành`: Chỉ kích hoạt (Enable) khi đã có ảnh minh chứng.

### 4.5. Hộp Thoại Trợ Lý Ảo Nông Nghiệp (Floating AI Chatbot Widget - SCR-KH-13)
* **Trạng thái thu gọn:** Nút tròn nổi góc phải màn hình (`56 x 56 px`) hình mầm cây với hiệu ứng đổ bóng `0 20px 25px -5px rgba(0,0,0,0.2)`.
* **Trạng thái mở rộng:** Cửa sổ chat `380 x 500 px`, hiển thị tên trợ lý "Agri Assistant (LLM RAG)", các nút gợi ý câu hỏi nhanh (Gợi ý sâu bệnh, dự kiến thu hoạch), và khung chat tương tác trực tiếp.

---

## 5. ĐẶC TẢ KỊCH BẢN & LUỒNG TƯƠNG TÁC (PROTOTYPE USER FLOWS)

### 🟢 Luồng 1: Khám phá, Đặt thuê & Thanh toán (Customer Booking Journey)
1. **Bắt đầu:** Tại `SCR-KH-02` (Marketplace), khách hàng lọc diện tích 25m², chọn chất đất phù hợp.
2. **Xem chi tiết:** Bấm vào thẻ `#L01-P02` $\rightarrow$ Điều hướng sang `SCR-KH-03` (Chi tiết Plot).
3. **Kiểm tra thông số:** Khách duyệt ảnh luống đất, chỉ số IoT trực tiếp (ẩm đất 68.2%, pH 6.5) và danh mục cây trồng tương thích (Cải ngọt F1).
4. **Cấu hình đơn thuê:** Bấm `Thuê Plot Này Ngay` $\rightarrow$ Mở màn hình `SCR-KH-04`.
   * Khách chọn cây trồng: *Cải ngọt F1*.
   * Khách chọn hình thức canh tác: Chuyển đổi giữa **Self-growing** (1.800.000 đ) và **Assisted-growing** (2.700.000 đ gồm 900.000 đ phí chăm sóc trọn gói). Bảng giá tự động tính toán tức thì.
5. **Kích hoạt khóa giữ chỗ (15-min Lock):** Bấm `Xác Nhận Giữ Chỗ & Tiến Hành Thanh Toán` $\rightarrow$ Kích hoạt bộ đếm ngược 15:00 trên đỉnh màn hình, chuyển trạng thái đơn sang `PAYMENT_PENDING`.
6. **Thanh toán trọn gói 100%:** Điều hướng sang `SCR-KH-05` hiển thị mã QR VietQR $\rightarrow$ Bấm `Mô Phỏng: Thanh Toán Thành Công`.
7. **Kích hoạt hợp đồng:** Hệ thống đóng đơn giữ chỗ, chuyển hợp đồng sang `CONFIRMED`/`ACTIVE` và tự động điều hướng về `SCR-KH-01` (Dashboard Vườn của tôi).

### 🟢 Luồng 2: Giám sát Canh tác & Tương tác Trợ lý Ảo AI
1. **Tại `SCR-KH-01`:** Khách theo dõi thanh tiến trình chu kỳ cây (Ngày 18/35 ngày - 51%), 3 khối chỉ số vi khí hậu IoT thời gian thực và 2 bài viết nhật ký gần nhất.
2. **Xem Farm Diary đầy đủ:** Bấm `Xem Farm Diary & Ảnh` $\rightarrow$ Mở `SCR-KH-08` hiển thị dòng thời gian chăm sóc, ảnh luống rau thực tế độ nét cao và định mức vật tư tiêu hao.
3. **Hỏi đáp AI Chatbot 24/7:** Bấm vào nút `AI Nông Nghiệp 24/7` ở góc phải dưới $\rightarrow$ Cửa sổ chat mở ra:
   * Bấm câu hỏi mẫu: *"Lá cải có lỗ nhỏ li ti là bệnh gì?"*
   * AI phản hồi ngay lập tức: Giải thích nguyên nhân bọ nhảy sọc cong và xác nhận nhân viên hiện trường đã phun dịch tỏi ớt sinh học phòng ngừa theo đúng quy trình chuẩn.

### 🟢 Luồng 3: Chuyên Viên Lao Động Thực Thi Task Hiện Trường (Mobile View)
1. **Chuyển vai trò:** Bấm Tab `👷‍♂️ Lao Động (CVLĐ)` trên thanh Header $\rightarrow$ Khung hình tự động chuyển sang chế độ **Mobile iPhone (390px)** tại `SCR-CVLD-01`.
2. **Xem danh sách công việc:** Nhân viên thấy tác vụ ca sáng: *"Bón thúc đợt 2: Phân trùn quế quanh gốc tại Thửa #L01-P02"*.
3. **Chụp ảnh nghiệm thu (Bắt buộc theo BR15):** Bấm `📷 Chụp Ảnh Nghiệm Thu` $\rightarrow$ Giả lập camera chụp ảnh thực địa thành công, ảnh minh chứng luống rau hiện ra.
4. **Đóng task:** Bấm `Xác Nhận Hoàn Thành Task` $\rightarrow$ Thông báo thành công: Vật tư 100g trùn quế được trừ kho, dữ liệu và ảnh nghiệm thu lập tức đồng bộ sang `SCR-KH-08` (Farm Diary của khách hàng).

### 🟢 Luồng 4: Chuyên Gia Nông Nghiệp Duyệt Kế Hoạch Canh Tác (48h SLA)
1. **Chuyển vai trò:** Bấm Tab `👨‍🌾 Chuyên Gia (CGNN)` $\rightarrow$ Chuyển đến `SCR-CGNN-07`.
2. **Kiểm tra SLA:** Xem cảnh báo thời hạn tự động duyệt BR12 (còn lại 32 giờ trước khi kích hoạt quy trình chuẩn mặc định).
3. **Duyệt 16 công việc:** Kiểm tra lịch trình bón phân, tưới nước, tỉa cành sinh từ Standard Process Template và nhấn `Phê Duyệt & Phát Hành Lịch Trình`.

### 🟢 Luồng 5: Quản Trị Viên Giám Sát Vận Hành & Hàng Đợi Khóa Đất
1. **Chuyển vai trò:** Bấm Tab `⚡ Admin (AD)` $\rightarrow$ Chuyển đến `SCR-AD-01`.
2. **Giám sát số liệu:** Theo dõi tỷ lệ lấp đầy 428/500 Plots (85.6%), doanh thu tháng và tần suất cảm biến IoT 16.7 WPS.
3. **Theo dõi Distributed Lock (Redis):** Bảng thời gian thực hiển thị các Plot đang trong thời gian giữ chỗ 15 phút, thời gian TTL còn lại và nút hỗ trợ hủy cưỡng chế nếu phát hiện gian lận.

---

## 6. HƯỚNG DẪN SỬ DỤNG & TRÌNH CHIẾU KHẢO THÍ

### 6.1. Cách Mở & Chạy Prototype Trực Tiếp
Không cần cài đặt Node.js hay web server phức tạp, bạn có thể chạy nguyên mẫu bằng 1 trong các cách sau:
* **Cách 1 (Nhanh nhất):** Mở trình duyệt web (Chrome, Edge, Brave) và kéo thả file `D:\isp392\docs\prototype\index.html` vào cửa sổ trình duyệt (hoặc ấn đúp chuột vào file).
* **Cách 2 (Mở qua Local Server):**
  ```bash
  cd /d/isp392/docs/prototype
  python -m http.server 8080
  # Sau đó truy cập: http://localhost:8080
  ```

### 6.2. Kịch Bản 5 Phút Thuyết Trình Demo Trước Giảng Viên
Khi chấm thi môn ISP392 tại các buổi review hoặc Final Presentation, nhóm có thể tự tin trình diễn kịch bản sau:
1. **Phút 1:** Trình chiếu `SCR-KH-02` (Marketplace) $\rightarrow$ Giới thiệu giải pháp giải quyết bài toán niềm tin thực phẩm sạch của cư dân đô thị bằng cách thuê Plot và theo dõi IoT.
2. **Phút 2:** Chọn Plot `#L01-P02` $\rightarrow$ Thể hiện logic tính giá phân hóa giữa **Self-growing** và **Assisted-growing** $\rightarrow$ Bấm giữ chỗ để kích hoạt **Distributed Lock 15 phút (Redis)** trên đỉnh màn hình để chứng minh kiến trúc xử lý Concurrency/Double Booking.
3. **Phút 3:** Mô phỏng thanh toán thành công 100% Upfront $\rightarrow$ Điều hướng về `SCR-KH-01` Dashboard xem vi khí hậu IoT thời gian thực và bấm hỏi đáp trợ lý ảo **AI Chatbot 24/7 (RAG)**.
4. **Phút 4:** Bấm chuyển sang Role **CVLĐ (Mobile Frame)** $\rightarrow$ Giảng viên sẽ rất ấn tượng khi thấy màn hình di động của nhân viên chăm sóc, chứng minh quy tắc **BR15 (Bắt buộc chụp ảnh nghiệm thu)** trước khi cho phép đóng task.
5. **Phút 5:** Chuyển sang Role **CGNN** và **AD** $\rightarrow$ Trình bày cơ chế **SLA 48h Auto-Approve** và bảng theo dõi hàng đợi khóa giữ chỗ TTL 15 phút của hệ thống.
