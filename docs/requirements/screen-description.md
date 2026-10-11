# DANH SÁCH MÀN HÌNH & MÔ TẢ CHI TIẾT (SCREEN LIST & SCREEN DESCRIPTION)
> **Dự án:** Nền Tảng Thuê Plot & Theo Dõi Trải Nghiệm Canh Tác  
> **Phiên bản:** 2.1 (Đồng bộ research-proposal.md v2.1 & user-stories.md)  
> **Mục đích:** Liệt kê toàn bộ màn hình hệ thống, mô tả mục đích, thành phần UI, sự kiện xử lý và Business Rules áp dụng.

---

## 📑 MỤC LỤC
- [1. Quy ước đặt mã](#1-quy-ước-đặt-mã)
- [2. Tổng quan Site Map](#2-tổng-quan-site-map)
- [3. Màn hình Chung (PUBLIC)](#3-màn-hình-chung-public)
- [4. Màn hình Khách hàng (KH)](#4-màn-hình-khách-hàng-kh)
- [5. Màn hình Administrator (AD)](#5-màn-hình-administrator-ad)
- [6. Màn hình Chuyên gia Nông nghiệp (CGNN)](#6-màn-hình-chuyên-gia-nông-nghiệp-cgnn)
- [7. Màn hình Chuyên viên Lao động (CVLĐ)](#7-màn-hình-chuyên-viên-lao-động-cvlđ)

---

## 1. Quy ước đặt mã

| Tiền tố | Ý nghĩa | Ví dụ |
|---|---|---|
| `SCR-PUB-xx` | Màn hình công khai (Public) | SCR-PUB-01 |
| `SCR-KH-xx` | Màn hình dành cho Khách hàng | SCR-KH-01 |
| `SCR-AD-xx` | Màn hình dành cho Administrator | SCR-AD-01 |
| `SCR-CGNN-xx` | Màn hình dành cho Chuyên gia NN | SCR-CGNN-01 |
| `SCR-CVLD-xx` | Màn hình dành cho Chuyên viên LĐ | SCR-CVLD-01 |

---

## 2. Tổng quan Site Map

```
├── PUBLIC
│   ├── SCR-PUB-01: Trang chủ (Landing Page)
│   ├── SCR-PUB-02: Đăng ký tài khoản
│   ├── SCR-PUB-03: Đăng nhập
│   ├── SCR-PUB-04: Quên mật khẩu
│   └── SCR-PUB-05: Đặt lịch xem đất (Site Visit Booking)
│
├── KHÁCH HÀNG (KH)
│   ├── SCR-KH-01: Dashboard KH
│   ├── SCR-KH-02: Marketplace – Danh sách Plot
│   ├── SCR-KH-03: Chi tiết Plot
│   ├── SCR-KH-04: Đặt thuê Plot (Chọn Crop + Thời gian)
│   ├── SCR-KH-05: Thanh toán (Reservation + Mock Payment)
│   ├── SCR-KH-06: Chọn Hình thức canh tác (Self / Assisted)
│   ├── SCR-KH-07: Xem Cultivation Plan & Phê duyệt
│   ├── SCR-KH-08: Farm Diary Timeline
│   ├── SCR-KH-09: Tạo nhật ký mới (Self-growing)
│   ├── SCR-KH-10: Dashboard IoT & Thời tiết
│   ├── SCR-KH-11: Đặt Service Request (Dịch vụ lẻ)
│   ├── SCR-KH-12: Chat tư vấn 1-1 với CGNN
│   ├── SCR-KH-13: AI Chatbot
│   ├── SCR-KH-14: Xác nhận thu hoạch (Harvest Result)
│   ├── SCR-KH-15: Lịch sử thuê (Read-only)
│   ├── SCR-KH-16: Hồ sơ cá nhân & Đổi mật khẩu
│   └── SCR-KH-17: Trung tâm thông báo
│
├── ADMINISTRATOR (AD)
│   ├── SCR-AD-01: Dashboard AD (Thống kê tổng hợp)
│   ├── SCR-AD-02: Quản lý User & Phân quyền RBAC
│   ├── SCR-AD-03: Quản lý Land (Danh sách + Form)
│   ├── SCR-AD-04: Quản lý Plot (Danh sách + Form + IoT)
│   ├── SCR-AD-05: Cấu hình Marketplace (Published/Hidden)
│   ├── SCR-AD-06: Quản lý danh mục Dịch vụ phát sinh
│   ├── SCR-AD-07: Giám sát Reservation & Rental
│   ├── SCR-AD-08: Phân công Care Task cho CVLĐ
│   ├── SCR-AD-09: Tiếp nhận & Phân công Service Request
│   ├── SCR-AD-10: Giám sát Cảnh báo IoT
│   └── SCR-AD-11: Tra cứu Audit Log
│
├── CHUYÊN GIA NÔNG NGHIỆP (CGNN)
│   ├── SCR-CGNN-01: Dashboard CGNN
│   ├── SCR-CGNN-02: Quản lý Crop & Variety
│   ├── SCR-CGNN-03: Thiết lập Plot–Crop Compatibility
│   ├── SCR-CGNN-04: Soạn Standard Process Template
│   ├── SCR-CGNN-05: Cấu hình ngưỡng IoT theo giai đoạn
│   ├── SCR-CGNN-06: Quản lý kho tài liệu chuyên môn
│   ├── SCR-CGNN-07: Lập & Hiệu chỉnh Kế hoạch Canh tác
│   ├── SCR-CGNN-08: Đề xuất Plan Revision
│   ├── SCR-CGNN-09: Chat tư vấn KH (KH ↔ CGNN)
│   ├── SCR-CGNN-10: Tiếp nhận Issue Report & Chat CVLĐ
│   └── SCR-CGNN-11: Tư vấn trước thuê (Pre-rental)
│
└── CHUYÊN VIÊN LAO ĐỘNG (CVLĐ)
    ├── SCR-CVLD-01: Dashboard CVLĐ (Danh sách task hôm nay)
    ├── SCR-CVLD-02: Chi tiết Care Task & Hướng dẫn KT
    ├── SCR-CVLD-03: Thực thi Task (Ghi vật tư + Chụp ảnh)
    ├── SCR-CVLD-04: Xác nhận hoàn thành Task
    ├── SCR-CVLD-05: Tạo Issue Report
    ├── SCR-CVLD-06: Chat với CGNN
    ├── SCR-CVLD-07: Hỗ trợ thu hoạch
    └── SCR-CVLD-08: Lịch sử công việc
```

**Tổng cộng: 47 màn hình** (4 Public + 17 KH + 11 AD + 11 CGNN + 8 CVLĐ)

---

## 3. Màn hình Chung (PUBLIC)

---

### SCR-PUB-01: Trang chủ (Landing Page)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Giới thiệu nền tảng, hiển thị Plot nổi bật và điều hướng KH đến Marketplace |
| **Actor** | Guest (chưa đăng nhập) |
| **URL** | `/` |
| **UC liên quan** | — |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Header/Navbar | Navigation Bar | Logo, menu (Trang chủ, Marketplace, Về chúng tôi, Đăng nhập/Đăng ký) |
| 2 | Hero Banner | Section | Hình ảnh lớn + Slogan + Nút CTA "Khám phá vườn ngay" |
| 3 | Giới thiệu nền tảng | Section | 3 icon: Chọn Plot → Trồng rau → Thu hoạch |
| 4 | Plot nổi bật | Card Grid | 4-6 thẻ Plot đang Published kèm ảnh, giá, diện tích |
| 5 | Testimonials | Section | Đánh giá từ khách thuê (nếu có) |
| 6 | Footer | Footer | Thông tin liên hệ, liên kết nhanh, bản quyền |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Click "Khám phá vườn ngay" | Điều hướng → SCR-KH-02 (Marketplace) |
| 2 | Click thẻ Plot nổi bật | Điều hướng → SCR-KH-03 (Chi tiết Plot) |
| 3 | Click "Đăng nhập" | Điều hướng → SCR-PUB-03 |
| 4 | Click "Đăng ký" | Điều hướng → SCR-PUB-02 |

---

### SCR-PUB-02: Đăng ký tài khoản

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng mới tạo tài khoản KH |
| **Actor** | Guest |
| **URL** | `/register` |
| **UC liên quan** | UC-KH01, US1.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Form đăng ký | Form | Gồm các trường bên dưới |
| 2 | Họ và tên | Text Input | Required, min 2 ký tự |
| 3 | Email | Email Input | Required, validate format email |
| 4 | Số điện thoại | Tel Input | Required, đúng 10 chữ số |
| 5 | Mật khẩu | Password Input | Required, ≥ 8 ký tự, chữ hoa + chữ thường + số |
| 6 | Xác nhận mật khẩu | Password Input | Required, phải khớp mật khẩu |
| 7 | Nút "Đăng ký" | Button (Primary) | Submit form |
| 8 | Link "Đã có tài khoản?" | Link | Điều hướng → SCR-PUB-03 |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Submit form | Validate client-side → Gửi POST `/api/register` |
| 2 | Email/SĐT bị trùng | Hiển thị thông báo lỗi inline |
| 3 | Đăng ký thành công | Toast "Đăng ký thành công!" → Redirect SCR-PUB-03 |
| 4 | Validate mật khẩu yếu | Hiển thị lỗi real-time dưới ô input |

**Business Rules:** Tài khoản mới tự động gán `ROLE_CUSTOMER`. Email phải unique.

---

### SCR-PUB-03: Đăng nhập

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xác thực danh tính và điều hướng theo vai trò |
| **Actor** | Guest |
| **URL** | `/login` |
| **UC liên quan** | UC-KH01, US1.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Email | Email Input | Required |
| 2 | Mật khẩu | Password Input | Required, có icon toggle show/hide |
| 3 | Nút "Đăng nhập" | Button (Primary) | Submit |
| 4 | Link "Quên mật khẩu?" | Link | → SCR-PUB-04 |
| 5 | Link "Chưa có tài khoản?" | Link | → SCR-PUB-02 |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Submit form | POST `/api/login` → Nhận JWT Token |
| 2 | Đăng nhập thành công | Lưu Token → Redirect theo Role: KH→SCR-KH-01, AD→SCR-AD-01, CGNN→SCR-CGNN-01, CVLĐ→SCR-CVLD-01 |
| 3 | Sai mật khẩu | Hiển thị "Email hoặc mật khẩu không đúng" |
| 4 | Tài khoản bị khóa | Hiển thị "Tài khoản đã bị khóa, liên hệ Admin" |

---

### SCR-PUB-04: Quên mật khẩu

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Khôi phục mật khẩu qua email |
| **Actor** | Guest |
| **URL** | `/forgot-password` |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Email | Email Input | Required |
| 2 | Nút "Gửi link đặt lại" | Button (Primary) | Submit |

**Sự kiện:** Submit → Gửi email chứa link reset → Trang đặt lại mật khẩu mới.

---

### SCR-PUB-05: Đặt lịch xem đất (Site Visit Booking)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Đặt lịch hẹn đến trực tiếp nông trại khảo sát hiện trạng thửa đất trước khi thuê |
| **Actor** | Guest / Khách hàng |
| **URL** | `/booking/site-visit` hoặc `/marketplace/plot/{plotId}/visit` |
| **UC liên quan** | US3.2b |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thửa đất quan tâm | Dropdown / Readonly Card | Chọn thửa đất muốn xem (hoặc tự động điền nếu đi từ SCR-KH-03) |
| 2 | Ngày đến thăm | Date Picker | Chọn ngày đến thăm (tối thiểu trước 24 giờ) |
| 3 | Khung giờ (Time Slot) | Radio Group | Ca sáng (08:30 - 10:30) / Ca chiều (14:30 - 16:30) |
| 4 | Thông tin người liên hệ | Input Fields | Họ tên, Số điện thoại, Email |
| 5 | Số người tham quan | Number Input | Mặc định 1 (tối đa 5 người) |
| 6 | Ghi chú nhu cầu | Textarea | Câu hỏi hoặc yêu cầu đặc biệt |
| 7 | Nút "Xác nhận đặt lịch" | Button (Primary) | Submit → Tạo bản ghi `site_visits` |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Submit form thành công | Toast thông báo thành công → Tạo bản ghi `site_visits` (PENDING) → Gửi thông báo cho Admin nông trại |
| 2 | Admin xác nhận | Trạng thái chuyển CONFIRMED → Gửi mã QR Check-in và chỉ đường đến SĐT/Email của khách |

---

## 4. Màn hình Khách hàng (KH)

---

### SCR-KH-01: Dashboard Khách hàng

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Trang chủ sau đăng nhập: tổng quan mảnh vườn đang thuê, tiến độ canh tác, thông báo |
| **Actor** | KH (ROLE_CUSTOMER) |
| **URL** | `/customer/dashboard` |
| **UC liên quan** | UC-KH11, US7.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Sidebar/Topbar | Navigation | Menu: Dashboard, Marketplace, Rental, Diary, IoT, Chat, Lịch sử, Profile |
| 2 | Thẻ "Vườn đang thuê" | Card | Hiển thị Plot đang Active: Mã Plot, Cây trồng, Hình thức (Self/Assisted), Ngày bắt đầu/kết thúc |
| 3 | Thanh tiến trình | Progress Bar | % hoàn thành chu kỳ, ngày hiện tại / tổng ngày |
| 4 | Giai đoạn hiện tại | Info Card | Tên giai đoạn, hướng dẫn chăm sóc tóm tắt |
| 5 | IoT tóm tắt | 3 Gauge Cards | Nhiệt độ (°C), Ẩm đất (%), Ẩm khí (%) – kèm trạng thái màu |
| 6 | Thông báo gần nhất | Notification List | 5 thông báo mới nhất (cảnh báo IoT, task hoàn thành, thu hoạch) |
| 7 | Nút nhanh | Button Group | "Xem Farm Diary", "Đặt dịch vụ", "Hỏi Chuyên gia" |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Click "Xem Farm Diary" | → SCR-KH-08 |
| 2 | Click "Đặt dịch vụ" | → SCR-KH-11 |
| 3 | Click "Hỏi Chuyên gia" | → SCR-KH-12 |
| 4 | Click thông báo | Điều hướng đến màn hình tương ứng |

---

### SCR-KH-02: Marketplace – Danh sách Plot

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Tìm kiếm, lọc và duyệt các Plot đang mở cho thuê |
| **Actor** | KH |
| **URL** | `/marketplace` |
| **UC liên quan** | UC-KH02, US3.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thanh tìm kiếm | Search Input | Tìm theo tên Plot, khu đất |
| 2 | Bộ lọc | Filter Panel | Khu đất (Dropdown), Khoảng diện tích (Slider), Khoảng giá (Slider), Loại cây muốn trồng (Multi-select) |
| 3 | Danh sách Plot | Card Grid | Mỗi thẻ: Ảnh, Mã Plot, Diện tích, Giá/tháng, Nhóm cây, Badge trạng thái |
| 4 | Phân trang | Pagination | Trang 1, 2, 3... |
| 5 | Sắp xếp | Dropdown | Giá tăng/giảm, Diện tích, Mới nhất |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Thay đổi bộ lọc | Gọi API lọc danh sách, cập nhật kết quả |
| 2 | Click thẻ Plot | → SCR-KH-03 (Chi tiết Plot) |
| 3 | Nhập tìm kiếm | Debounce 300ms → Filter danh sách |

**Business Rules:** Chỉ hiển thị Plot có Listing Status = `Published`. Plot đang `Reserved` hoặc `Rented` không xuất hiện.

---

### SCR-KH-03: Chi tiết Plot

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem đầy đủ thông tin kỹ thuật, hình ảnh, IoT, thời tiết và danh mục cây tương thích |
| **Actor** | KH |
| **URL** | `/marketplace/plot/{plotId}` |
| **UC liên quan** | UC-KH03, US3.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thư viện ảnh | Image Gallery/Carousel | Ảnh thực tế của Plot (zoom được) |
| 2 | Thông tin cơ bản | Info Section | Mã Plot, Diện tích, Vị trí trong vườn, Loại thổ nhưỡng, Nguồn nước |
| 3 | Bảng giá | Price Table | Giá thuê/tháng, Phí Assisted-growing (không thu cọc) |
| 4 | Cây trồng tương thích | Tag List / Table | Danh sách Crop tương thích + thời gian sinh trưởng mỗi loại |
| 5 | IoT hiện tại | 3 Gauge Cards | Nhiệt độ, Ẩm đất, Ẩm khí + thời điểm đo gần nhất |
| 6 | Thời tiết | Weather Widget | Thời tiết hôm nay + dự báo 3-5 ngày (từ Weather API) |
| 7 | Lịch khả dụng | Calendar | Hiển thị khoảng thời gian Plot đã/chưa được thuê |
| 8 | Nút "Thuê Plot này" | Button (Primary) | Bắt đầu quy trình thuê |
| 9 | Nút "Hỏi Chuyên gia" | Button (Secondary) | Mở phiên tư vấn Pre-rental |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Click "Thuê Plot này" | → SCR-KH-04 (Form đặt thuê) |
| 2 | Click "Hỏi Chuyên gia" | Tạo ConsultationTicket loại PRE_RENTAL → → SCR-KH-12 |

**Business Rules:** BR06 (Tư vấn tùy chọn), BR03 (Tương thích Plot–Crop).

---

### SCR-KH-04: Đặt thuê Plot (Chọn Crop + Thời gian + Hình thức canh tác)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | KH chọn giống cây, ngày bắt đầu/kết thúc, hình thức canh tác và xác nhận đặt chỗ |
| **Actor** | KH |
| **URL** | `/marketplace/plot/{plotId}/book` |
| **UC liên quan** | UC-KH05, UC-KH06, US3.4, US3.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Tóm tắt Plot | Info Card | Ảnh, mã, diện tích, giá (read-only) |
| 2 | Chọn giống cây | Dropdown | Chỉ hiển thị Crop tương thích với Plot |
| 3 | Thông tin giống cây | Detail Card | Thời gian sinh trưởng, mùa vụ tối ưu (auto-fill khi chọn) |
| 4 | Ngày bắt đầu | Date Picker | Chọn Start Date (không chọn ngày quá khứ) |
| 5 | Ngày kết thúc | Date Picker | Chọn End Date |
| 6 | Hình thức canh tác | Radio Group | Self-growing / Assisted-growing – chọn ngay tại bước giữ chỗ (BR05, BR11) |
| 7 | Tổng tiền dự kiến | Summary Card | Auto-calc: Tiền thuê theo số ngày + phí gói chăm sóc nếu Assisted (100% Upfront, không cọc). Kèm thông báo: Đã bao gồm trọn gói 01 bộ Starter Kit (cây con F1 + khay giá thể ban đầu) |
| 8 | Thông báo kiểm tra | Alert Box | Hiển thị kết quả validate (hợp lệ / lỗi) |
| 9 | Nút "Tiến hành thuê" | Button (Primary) | Submit → Tạo Reservation |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Chọn Crop | Auto-fill thông tin giống cây, tính thời lượng tối thiểu |
| 2 | Chọn ngày | Hệ thống kiểm tra: Tương thích? Thời lượng đủ? Trùng lịch? |
| 3 | Chọn hình thức | Tổng tiền dự kiến cập nhật thêm phí gói chăm sóc nếu Assisted |
| 4 | Validate lỗi | Hiển thị Alert: "Thời gian thuê chưa đủ cho loại cây này" hoặc "Lịch trùng" |
| 5 | Click "Tiến hành thuê" | Tạo Reservation (15 phút, kèm Cultivation Mode) → Redirect SCR-KH-05 |

**Business Rules:** BR03 (Bắt buộc chọn giống trong danh mục kiểm định của Farmely), BR04 (Thời lượng ≥ Duration + Buffer), BR07, BR08 (Chống trùng lịch, Reservation 15 phút), BR09 (Tháng đầu bao gồm bộ Starter Kit).

---

### SCR-KH-05: Ký Hợp đồng & Thanh toán trực tiếp (Mock Payment)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Ký Hợp đồng điện tử và thanh toán tiền thuê trực tiếp cho Hợp đồng trong thời hạn 15 phút (100% Upfront, không cọc, không qua Order trung gian) |
| **Actor** | KH |
| **URL** | `/customer/payment/{reservationId}` |
| **UC liên quan** | UC-KH07, US3.6 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Đồng hồ đếm ngược | Countdown Timer | 15:00 → 00:00 (màu đỏ khi < 3 phút) |
| 2 | Chi tiết hóa đơn hợp đồng | Invoice Table | Tiền thuê đất, Phí gói canh tác (nếu có), Starter Kit (0đ - khuyến mãi), Tổng giá trị Hợp đồng (`total_price`) |
| 3 | Phương thức thanh toán | Radio Buttons | "Thẻ ngân hàng mô phỏng" / "Ví điện tử mô phỏng" |
| 4 | Mock Payment Toggle | Toggle Switch | Giả lập: "Thành công" / "Thất bại" |
| 5 | Nút "Ký Hợp đồng & Thanh toán" | Button (Primary) | Submit thanh toán trực tiếp cho Hợp đồng |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Countdown = 0 | Reservation hết hạn → Alert "Hết thời gian" → Redirect SCR-KH-02 |
| 2 | Click "Thanh toán" | Reservation → PAYMENT_PENDING, gia hạn thêm 03 phút (Grace Period – BR08) → chuyển hướng cổng thanh toán |
| 3 | Chọn "Thành công" + Submit | Tạo PaymentTransaction SUCCESS gắn với Contract ID → Hợp đồng CONFIRMED → Redirect SCR-KH-06 |
| 4 | Chọn "Thất bại" + Submit | Alert "Thanh toán thất bại" → Giữ nguyên, cho thử lại |

**Business Rules:** BR08 (15 phút + Grace Period 3 phút), BR09 (Thanh toán trả trước 100%, không thu cọc). Hợp đồng chuyển Active khi đến Start Date. Triệt tiêu dư thừa dữ liệu amount giữa Order và Contract.

---

### SCR-KH-06: Xem Hình thức canh tác & Khởi động luồng chăm sóc (Self / Assisted)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | KH xem lại hình thức đã chọn khi đặt chỗ (cố định theo BR05) và khởi động luồng trải nghiệm tương ứng |
| **Actor** | KH |
| **URL** | `/customer/rental/{rentalId}/mode` |
| **UC liên quan** | UC-KH08/KH09, US5.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thẻ Self-growing | Selection Card | Icon + Mô tả: "Tự đến vườn chăm sóc, ghi nhật ký. Không phát sinh phí." |
| 2 | Thẻ Assisted-growing | Selection Card | Icon + Mô tả: "Đội ngũ chăm sóc toàn bộ. CGNN lập kế hoạch, bạn duyệt." |
| 3 | So sánh 2 hình thức | Comparison Table | Bảng so sánh: Chi phí, Ai chăm sóc, Farm Diary, Service Request |
| 4 | Nút "Bắt đầu trải nghiệm" | Button (Primary) | Khởi động luồng theo mode đã chọn |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Mode = Self-growing + Bắt đầu | Hiển thị Quy trình canh tác chuẩn (Read-only) → Redirect SCR-KH-01 (Dashboard) |
| 2 | Mode = Assisted-growing + Bắt đầu | Thông báo CGNN lập Cultivation Plan → Redirect SCR-KH-01 (chờ KH duyệt tại SCR-KH-07) |

**Business Rules:** BR05 (Cố định mode trong kỳ thuê), BR12 (Assisted: CGNN lập Plan → KH Approve).

---

### SCR-KH-07: Xem Cultivation Plan & Phê duyệt

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | KH xem kế hoạch canh tác đã qua CGNN review và phê duyệt (Approve) |
| **Actor** | KH (Assisted-growing) |
| **URL** | `/customer/rental/{rentalId}/plan` |
| **UC liên quan** | UC-KH10, US5.4 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Trạng thái Plan | Status Badge | Draft / Pending Approval / Active |
| 2 | Timeline kế hoạch | Vertical Timeline | Các giai đoạn + ngày + công việc dự kiến |
| 3 | Chi tiết giai đoạn | Expandable Section | Định mức vật tư, hướng dẫn kỹ thuật |
| 4 | Nút "Phê duyệt" | Button (Success) | Approve Plan → Kích hoạt sinh Care Task |
| 5 | Nút "Yêu cầu chỉnh sửa" | Button (Warning) | Gửi feedback cho CGNN |
| 6 | Lịch sử phiên bản | Version History | Nếu có Plan Revision: hiển thị diff so với phiên bản trước |

**Sự kiện xử lý:**

| # | Sự kiện | Hành động |
|---|---|---|
| 1 | Click "Phê duyệt" | Plan → Active, hệ thống sinh Care Task → Thông báo AD |
| 2 | Click "Yêu cầu chỉnh sửa" | Mở modal nhập feedback → Gửi cho CGNN |

**Business Rules:** BR12 (CGNN lập Plan → KH approve), BR13 (Plan Revision cần KH duyệt).

---

### SCR-KH-08: Farm Diary Timeline

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem dòng thời gian nhật ký canh tác: bài tự viết xen kẽ bài tự động từ CVLĐ |
| **Actor** | KH |
| **URL** | `/customer/rental/{rentalId}/diary` |
| **UC liên quan** | UC-KH13, US7.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Timeline Feed | Vertical Timeline | Bài nhật ký mới nhất ở trên |
| 2 | Mỗi bài nhật ký | Diary Card | Ngày giờ, Người ghi (KH/CVLĐ icon), Nội dung, Vật tư, Ảnh gallery |
| 3 | Ảnh đính kèm | Image Lightbox | Click phóng to xem chi tiết |
| 4 | Nút "Tạo nhật ký mới" | FAB Button | Chỉ hiển thị khi mode = Self-growing → SCR-KH-09 |
| 5 | Bộ lọc | Filter | Theo ngày, Theo người ghi (Tất cả/KH/CVLĐ) |

**Business Rules:** BR17 (Task hoàn thành của CVLĐ tự động hiện trên Timeline).

---

### SCR-KH-09: Tạo nhật ký mới (Self-growing)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | KH tự chụp ảnh, ghi chép sau khi đến chăm sóc vườn |
| **Actor** | KH (Self-growing) |
| **URL** | `/customer/rental/{rentalId}/diary/new` |
| **UC liên quan** | UC-KH14, US7.3 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Upload ảnh | File Upload (Multi) | Tải tối đa 5 ảnh từ điện thoại/máy tính |
| 2 | Chiều cao cây | Number Input | Đơn vị: cm (tùy chọn) |
| 3 | Đánh giá sức khỏe cây | Radio Group | Tốt / Bình thường / Sâu hại |
| 4 | Ghi chép nội dung | Textarea | Mô tả công việc đã làm |
| 5 | Nút "Đăng nhật ký" | Button (Primary) | Submit |

---

### SCR-KH-10: Dashboard IoT & Thời tiết

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Giám sát vi khí hậu Plot đang thuê + dự báo thời tiết |
| **Actor** | KH |
| **URL** | `/customer/rental/{rentalId}/iot` |
| **UC liên quan** | UC-KH11, UC-KH12, US7.4, US7.6 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | 3 Gauge thời gian thực | Gauge Charts | Nhiệt độ (°C), Ẩm đất (%), Ẩm khí (%) – màu Xanh/Vàng/Đỏ |
| 2 | Thời điểm đo | Timestamp | "Lần đo gần nhất: 18/09/2026 15:00" |
| 3 | Biểu đồ lịch sử | Line Chart (Recharts) | Toggle: 24 giờ / 7 ngày. Đường ngưỡng min/max |
| 4 | Widget thời tiết | Weather Card | Hôm nay: Icon, Nhiệt độ, Gió, Xác suất mưa |
| 5 | Dự báo 5 ngày | Forecast Table | Bảng 5 ngày kèm icon + nhiệt độ |
| 6 | Cảnh báo | Alert Banner | Nếu chỉ số ngoài ngưỡng → Banner đỏ + hướng dẫn xử lý |

---

### SCR-KH-11: Đặt Dịch vụ chăm sóc & Gói ủy thác theo tháng (Services Component)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | KH đặt dịch vụ chăm sóc phát sinh (lẻ theo lượt) hoặc mua Gói ủy thác chăm sóc trọn gói 30 ngày (Temporary Full-care) khi bận |
| **Actor** | KH (đặc biệt Self-growing) |
| **URL** | `/customer/rental/{rentalId}/service-request` |
| **UC liên quan** | UC-KH15, US7.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Tab chuyển đổi | Segmented Control | "Dịch vụ lẻ theo lượt" / "Gói ủy thác chăm sóc 30 ngày" |
| 2 | Danh mục dịch vụ lẻ | Card List | Tưới nước, Phun chế phẩm sinh học, Làm cỏ bón phân + Đơn giá |
| 3 | Gói ủy thác 30 ngày | Pricing Card | Chi phí trọn gói 30 ngày, quyền lợi CVLĐ chăm sóc toàn bộ theo template của cây |
| 4 | Ngày bắt đầu áp dụng | Date Picker | Chọn ngày bắt đầu thực hiện |
| 5 | Ghi chú | Textarea | Yêu cầu đặc biệt |
| 6 | Tổng chi phí | Summary | Auto-calc tổng tiền |
| 7 | Nút "Thanh toán & Kích hoạt" | Button (Primary) | → Mock Payment → Tạo ServiceRequest |

**Business Rules:** 
- Khi mua Gói ủy thác 30 ngày: Sau thanh toán thành công, hệ thống tự động sinh các `care_tasks` tương ứng với các bước trong `template_steps` của 30 ngày đó và gán cho CVLĐ.
- Khi mua dịch vụ lẻ: Sinh 1 Care Task phát sinh gán cho CVLĐ.

---

### SCR-KH-12: Chat tư vấn 1-1 với CGNN

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Trao đổi trực tiếp với CGNN về sâu bệnh, kỹ thuật trồng |
| **Actor** | KH ↔ CGNN |
| **URL** | `/customer/consultation/{ticketId}` |
| **UC liên quan** | UC-KH16, US8.1, US8.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Danh sách ticket | Sidebar List | Các phiên tư vấn (OPEN / IN_PROGRESS / CLOSED) |
| 2 | Nút "Tạo câu hỏi mới" | Button | Mở form: Tiêu đề, Mô tả, Chọn Plot, Upload ≤ 3 ảnh |
| 3 | Vùng chat | Message Feed | Tin nhắn 2 chiều (KH & CGNN), hỗ trợ text + ảnh |
| 4 | Input gửi tin | Chat Input | Nhập text + Đính kèm ảnh |
| 5 | Panel thông số Plot | Side Panel | Giống cây, Ngày trồng, IoT 3 ngày, Farm Diary gần nhất |
| 6 | Nút "Đóng phiên" | Button | Đóng ticket → CLOSED |

**Business Rules:** BR25 (KH không trực tiếp chỉ đạo CVLĐ – gửi qua CGNN).

---

### SCR-KH-13: AI Chatbot

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Hỏi đáp 24/7 về kiến thức làm vườn |
| **Actor** | KH |
| **UC liên quan** | UC-KH17, US8.4 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Floating Widget | Chat Bubble | Ở góc phải dưới màn hình, click để mở |
| 2 | Cửa sổ chat | Chat Window | Lịch sử hội thoại + Input nhập câu hỏi |
| 3 | Disclaimer | Notice | "Thông tin AI mang tính tham khảo. Liên hệ CGNN khi cần chẩn đoán." |

---

### SCR-KH-14: Xác nhận thu hoạch & Nghiệm thu (Harvest Result)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem kết quả thu hoạch do CVLĐ cân đo & ảnh hiện trường, chọn phương thức nhận và xác nhận nghiệm thu |
| **Actor** | KH |
| **URL** | `/customer/rental/{rentalId}/harvest` |
| **UC liên quan** | UC-KH19, US9.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thông báo thu hoạch | Banner (Success) | "Vườn rau tại Plot đã sẵn sàng thu hoạch!" |
| 2 | Ảnh thu hoạch | Image Gallery | Ảnh sọt rau trên cân điện tử do CVLĐ chụp minh chứng |
| 3 | Sản lượng thực tế | Info Card | Số kg thực tế thu hoạch, Tên loại rau, Ngày cắt |
| 4 | Phương thức nhận hàng | Radio Group | "Tự đến nhận/thu hoạch tại vườn cuối tuần (Miễn phí)" / "Giao hàng tận nhà (Phí ship tính theo khu vực)" |
| 5 | Địa chỉ giao hàng | Input / Map | Điền địa chỉ nhận nếu chọn Giao hàng tận nhà |
| 6 | Đánh giá chất lượng | Star Rating (1-5) | Đánh giá độ hài lòng về chất lượng rau |
| 7 | Nút "Xác nhận nhận hàng (Nghiệm thu)" | Button (Primary) | KH xác nhận đã nhận nông sản → Đóng chu kỳ thu hoạch |

**Business Rules:** Tự đến hái/nhận cuối tuần: Hoàn toàn MIỄN PHÍ. Giao tận nhà tính thêm cước vận chuyển.

---

### SCR-KH-15: Quản lý Hợp đồng & Lịch sử canh tác

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Quản lý hợp đồng đang chạy, thực hiện Gia hạn (Renew) hoặc xem lại các kỳ thuê cũ (Read-only) |
| **Actor** | KH |
| **URL** | `/customer/contracts` hoặc `/customer/history` |
| **UC liên quan** | UC-KH20, US3.8, US9.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Danh sách Hợp đồng | Table/Card List | Mã Hợp đồng (`contract_code`), Plot, Cây, Ngày bắt đầu/kết thúc, Trạng thái (Active/Completed/Renewed) |
| 2 | Nút "Gia hạn hợp đồng (Renew)" | Button (Warning/Primary) | Hiển thị trước ngày kết thúc 07 ngày → Mở popup chọn chu kỳ mới |
| 3 | Click vào Hợp đồng | Expandable | Xem Farm Diary, IoT Chart, Harvest Result ở chế độ Read-only |

**Business Rules:** 
- Bấm Renew → Tạo Hợp đồng mới kế thừa qua `parent_contract_id`. 
- Nếu không Renew: Hết hạn hợp đồng, thửa đất tự động vào trạng thái `MAINTENANCE` đúng 4 ngày để cải tạo phơi ải đất, sau 4 ngày mới mở lại `AVAILABLE` (BR23).

---

### SCR-KH-16: Hồ sơ cá nhân & Đổi mật khẩu

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Cập nhật thông tin cá nhân, đổi mật khẩu |
| **Actor** | KH |
| **URL** | `/customer/profile` |
| **UC liên quan** | US1.3 |

**Thành phần UI:** Form cập nhật: Họ tên, SĐT, Địa chỉ, Avatar, Đổi mật khẩu (mật khẩu cũ + mới + xác nhận).

---

### SCR-KH-17: Trung tâm thông báo

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem tất cả thông báo: cảnh báo IoT, task hoàn thành, thu hoạch, Plan mới |
| **Actor** | KH |
| **URL** | `/customer/notifications` |

**Thành phần UI:** Danh sách thông báo (mới nhất trước), đánh dấu đã đọc/chưa đọc, click điều hướng.

---

## 5. Màn hình Administrator (AD)

---

### SCR-AD-01: Dashboard AD (Thống kê tổng hợp)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem tổng quan vận hành: tỷ lệ lấp đầy, doanh thu, task, tư vấn |
| **Actor** | AD (ROLE_ADMIN) |
| **URL** | `/admin/dashboard` |
| **UC liên quan** | UC-AD12, US9.4 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Sidebar Admin | Navigation | Menu: Dashboard, Users, Land, Plot, Rental, Tasks, Services, Alerts, Audit |
| 2 | KPI Cards | 4 Stat Cards | Tỷ lệ lấp đầy (%), Doanh thu tháng, Self vs Assisted (%), Task đúng hạn (%) |
| 3 | Biểu đồ doanh thu | Bar/Line Chart | Doanh thu thuê + dịch vụ theo tháng |
| 4 | Task hôm nay | Mini Table | Số task Pending / Assigned / Completed hôm nay |
| 5 | Cảnh báo IoT | Alert List | Cảnh báo đang active (nếu có) |

---

### SCR-AD-02: Quản lý User & Phân quyền RBAC

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | CRUD người dùng, gán vai trò, khóa/mở tài khoản |
| **Actor** | AD |
| **URL** | `/admin/users` |
| **UC liên quan** | UC-AD01, UC-AD02, US1.4 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng danh sách User | Data Table | Tên, Email, Role, Trạng thái (Active/Locked), Ngày tạo |
| 2 | Tìm kiếm + Lọc | Search + Filter | Tìm theo tên/email, Lọc theo Role |
| 3 | Nút "Thêm nhân viên" | Button | Mở modal tạo tài khoản ROLE_EXPERT / ROLE_STAFF |
| 4 | Nút Khóa/Mở | Toggle | Khóa tài khoản + nhập lý do → Ghi Audit Log |
| 5 | Nút Đổi Role | Dropdown | Thay đổi vai trò (không tự khóa chính mình) |

---

### SCR-AD-03: Quản lý Land

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | CRUD khu đất nông nghiệp |
| **Actor** | AD |
| **URL** | `/admin/lands` |
| **UC liên quan** | UC-AD03, US2.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng danh sách Land | Data Table | Tên, Địa chỉ, Diện tích, Số Plot, Trạng thái |
| 2 | Form Thêm/Sửa Land | Modal Form | Tên, Địa chỉ, GPS, Diện tích, Thổ nhưỡng, Nguồn nước, Mô tả, Upload ảnh |

---

### SCR-AD-04: Quản lý Plot

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Phân lô, cấu hình Plot, gắn IoT, thiết lập giá |
| **Actor** | AD |
| **URL** | `/admin/plots` |
| **UC liên quan** | UC-AD04, UC-AD05, US2.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng danh sách Plot | Data Table | Mã Plot, Land, Diện tích, Giá, IoT Code, Listing Status |
| 2 | Form Thêm/Sửa | Modal Form | Mã, Diện tích, Giá/tháng, Vị trí, IoT Device Code, Upload ảnh |
| 3 | Toggle Published/Hidden | Switch | Bật/tắt hiển thị trên Marketplace |

---

### SCR-AD-05: Quản lý danh mục Dịch vụ phát sinh

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Định nghĩa các gói dịch vụ lẻ cho KH đặt |
| **Actor** | AD |
| **URL** | `/admin/services` |
| **UC liên quan** | UC-AD09, US2.4 |

**Thành phần UI:** Data Table (Tên, Mô tả, Đơn giá, Active/Inactive) + Form CRUD.

---

### SCR-AD-06: Giám sát Reservation & Rental

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem toàn bộ Reservation và Rental, trạng thái, lịch sử thanh toán |
| **Actor** | AD |
| **URL** | `/admin/rentals` |
| **UC liên quan** | UC-AD07, US9.4 |

**Thành phần UI:** Data Table (Mã Rental, KH, Plot, Ngày, Trạng thái, Hình thức) + Filter + Chi tiết khi click.

---

### SCR-AD-07: Phân công Care Task cho CVLĐ

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem task chưa gán, phân công CVLĐ phù hợp |
| **Actor** | AD |
| **URL** | `/admin/tasks` |
| **UC liên quan** | UC-AD08, US6.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng task | Data Table | Task Name, Plot, Ngày, Trạng thái, Assigned Staff |
| 2 | Filter | Dropdown | Lọc: Chưa gán / Đã gán / Hoàn thành / Theo ngày |
| 3 | Nút "Phân công" | Button | Mở modal chọn CVLĐ từ danh sách nhân viên đang trực |

---

### SCR-AD-08: Tiếp nhận & Phân công Service Request

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem yêu cầu dịch vụ từ KH, phân công CVLĐ thực hiện |
| **Actor** | AD |
| **URL** | `/admin/service-requests` |
| **UC liên quan** | UC-AD10, US6.2 |

**Thành phần UI:** Data Table (KH, Dịch vụ, Ngày, Trạng thái) + Nút phân công CVLĐ.

---

### SCR-AD-09: Giám sát Cảnh báo IoT

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem tất cả cảnh báo môi trường vượt ngưỡng trên toàn hệ thống |
| **Actor** | AD |
| **URL** | `/admin/alerts` |
| **UC liên quan** | UC-AD11 |

**Thành phần UI:** Data Table (Plot, Loại cảnh báo, Giá trị, Ngưỡng, Thời gian) + Filter.

---

### SCR-AD-10: Tra cứu Audit Log

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Tra cứu nhật ký thao tác hệ thống phục vụ kiểm toán |
| **Actor** | AD |
| **URL** | `/admin/audit-log` |
| **UC liên quan** | UC-AD13, US9.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng Audit Log | Data Table | Thời gian, User, IP, Action, Entity, Mô tả |
| 2 | Filter | Multi Filter | Theo thời gian (Date Range), User, Loại Action |

---

## 6. Màn hình Chuyên gia Nông nghiệp (CGNN)

---

### SCR-CGNN-01: Dashboard CGNN

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Tổng quan: Proposal chờ review, Ticket tư vấn, Issue Report |
| **Actor** | CGNN (ROLE_EXPERT) |
| **URL** | `/expert/dashboard` |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Sidebar CGNN | Navigation | Dashboard, Crops, Processes, Proposals, Consultations, Issues, Documents |
| 2 | Card "Proposal chờ review" | Stat Card + Link | Số lượng Proposal Draft chờ review |
| 3 | Card "Ticket tư vấn" | Stat Card | Số ticket OPEN + IN_PROGRESS |
| 4 | Card "Issue Report" | Stat Card | Số Issue chưa phản hồi |
| 5 | Danh sách hành động | Action List | Top 5 việc cần xử lý khẩn cấp nhất |

---

### SCR-CGNN-02: Quản lý Crop & Variety

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Thêm/sửa thông tin giống cây trồng |
| **Actor** | CGNN |
| **URL** | `/expert/crops` |
| **UC liên quan** | UC-CGNN01, UC-CGNN02, US4.1 |

**Thành phần UI:** Data Table (Tên, Tên KH, Nhóm, Thời gian, Năng suất, Active) + Form CRUD (Tên giống, Tên khoa học, Nhóm rau, Duration, Năng suất, Mùa vụ, Sâu bệnh, Ảnh).

---

### SCR-CGNN-03: Thiết lập Plot–Crop Compatibility

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Gán cây trồng tương thích cho từng Plot |
| **Actor** | CGNN |
| **URL** | `/expert/compatibility` |
| **UC liên quan** | UC-CGNN03, US4.2 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Chọn Plot | Dropdown | Lọc theo Land → Plot |
| 2 | Danh sách Crop | Checkbox List | Tick chọn Crop tương thích |
| 3 | Nút "Lưu" | Button | Lưu bảng `PlotCropCompatibility` |

---

### SCR-CGNN-04: Soạn Standard Process Template

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xây dựng quy trình canh tác chuẩn cho từng giống cây |
| **Actor** | CGNN |
| **URL** | `/expert/processes` |
| **UC liên quan** | UC-CGNN04–CGNN08, US4.3, US4.4, US4.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Chọn Crop/Variety | Dropdown | Chọn giống cây cần soạn quy trình |
| 2 | Danh sách Stages | Sortable List | Các giai đoạn: Ươm → Phát triển → Tăng trưởng → Thu hoạch |
| 3 | Form Stage | Expandable Form | Tên, Day Offset (from-to), Tần suất tưới, Định mức nước |
| 4 | Hướng dẫn KT | Rich Text Editor | Markdown/Rich Text soạn hướng dẫn chi tiết |
| 5 | Vật tư khuyến nghị | Sub-table | Tên vật tư, Số lượng, Đơn vị |
| 6 | Ngưỡng IoT | Form Group | min_temp, max_temp, min_air_humidity, max_air_humidity, min_soil_moisture, max_soil_moisture |
| 7 | Nút "Lưu phiên bản" | Button | Lưu template + version number |

---

### SCR-CGNN-05: Quản lý kho tài liệu chuyên môn

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Upload, phân loại tài liệu KT cho AI Service tham chiếu |
| **Actor** | CGNN |
| **URL** | `/expert/documents` |
| **UC liên quan** | UC-CGNN09, US4.6 |

**Thành phần UI:** File Upload + Phân loại (Dropdown: Kỹ thuật trồng, Sâu bệnh, Dinh dưỡng) + Data Table.

---

### SCR-CGNN-06: Lập & Hiệu chỉnh Kế hoạch Canh tác

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem Kế hoạch canh tác khởi tạo từ Quy trình chuẩn, tinh chỉnh nội dung chuyên môn, gửi KH duyệt |
| **Actor** | CGNN |
| **URL** | `/expert/plans/{planId}` |
| **UC liên quan** | UC-CGNN11, US5.3 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Bảng danh sách Kế hoạch | Data Table | Rental, KH, Crop, Trạng thái (Draft/Pending/Active) |
| 2 | Chi tiết Kế hoạch | Form (Editable) | Timeline giai đoạn, task, vật tư – CGNN có thể chỉnh sửa |
| 3 | Nút "Gửi cho KH duyệt" | Button (Primary) | Chuyển Plan → Pending Approval → Thông báo KH |

---

### SCR-CGNN-07: Đề xuất Plan Revision

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Tạo phiên bản mới của Plan khi có biến động |
| **Actor** | CGNN |
| **URL** | `/expert/plans/{planId}/revision` |
| **UC liên quan** | UC-CGNN12, US5.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Plan hiện tại | Read-only View | Phiên bản đang Active |
| 2 | Form chỉnh sửa | Editable Form | Thêm/bỏ task, dời ngày, điều chỉnh vật tư |
| 3 | Lý do điều chỉnh | Textarea | Bắt buộc nhập (dịch bệnh, thời tiết...) |
| 4 | Nút "Gửi Revision" | Button | Tạo Plan Version mới → KH duyệt |

**Business Rules:** BR13 (Không sửa đè – tạo version mới, KH approve mới áp dụng).

---

### SCR-CGNN-08: Chat tư vấn KH (KH ↔ CGNN)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Giao diện chat phía CGNN – tư vấn sâu bệnh, Pre-rental |
| **Actor** | CGNN |
| **URL** | `/expert/consultations/{ticketId}` |
| **UC liên quan** | UC-CGNN13, US8.2 |

**Thành phần UI:** Tương tự SCR-KH-12 nhưng góc nhìn CGNN. Thêm: Nút "Nhận tư vấn" (gán expert_id), Panel Plot info, Farm Diary, IoT.

---

### SCR-CGNN-09: Tiếp nhận Issue Report & Chat CVLĐ

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem báo cáo sự cố từ CVLĐ, chat hướng dẫn kỹ thuật |
| **Actor** | CGNN ↔ CVLĐ |
| **URL** | `/expert/issues/{issueId}` |
| **UC liên quan** | UC-CGNN14, UC-CGNN15, US8.3 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Danh sách Issue | Sidebar List | Issue Report từ CVLĐ (Open / Resolved) |
| 2 | Chi tiết sự cố | Info Card | Ảnh sự cố, mô tả, Plot, cây trồng |
| 3 | Chat KT | Chat Window | Kênh riêng CVLĐ ↔ CGNN |
| 4 | Nút "Đề xuất Plan Revision" | Button | Liên kết → SCR-CGNN-07 nếu cần |

---

## 7. Màn hình Chuyên viên Lao động (CVLĐ)

---

### SCR-CVLD-01: Dashboard CVLĐ (Danh sách task hôm nay)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem công việc cần làm hôm nay, gom nhóm theo Plot |
| **Actor** | CVLĐ (ROLE_STAFF) |
| **URL** | `/staff/dashboard` |
| **UC liên quan** | UC-CVLD01, US6.3 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Topbar | Mobile Nav | Logo, Thông báo, Avatar |
| 2 | Danh sách task | Card List (Mobile-friendly) | Gom nhóm theo Plot. Mỗi card: Tên task, Plot, Giờ, Badge trạng thái |
| 3 | Click vào task | Navigate | → SCR-CVLD-02 |

**Lưu ý:** Giao diện tối ưu cho **điện thoại di động** (Mobile-first).

---

### SCR-CVLD-02: Chi tiết Care Task & Hướng dẫn KT

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Xem chi tiết task: hướng dẫn kỹ thuật, vật tư cần mang, vị trí Plot |
| **Actor** | CVLĐ |
| **URL** | `/staff/tasks/{taskId}` |
| **UC liên quan** | UC-CVLD02, UC-CVLD03, US6.3 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Tên & Loại task | Header | "Tưới nước – Plot L01-P03" |
| 2 | Hướng dẫn kỹ thuật | Rich Text Card | Nội dung từ Standard Process |
| 3 | Vật tư cần mang | Checklist | Phân trùn quế 0.5kg, Nước 10L... |
| 4 | Vị trí Plot | Map/Info | Khu đất, vị trí, loại cây trồng |
| 5 | Nút "Bắt đầu làm" | Button (Primary) | Chuyển task → IN_PROGRESS |

---

### SCR-CVLD-03: Thực thi Task (Ghi vật tư + Chụp ảnh)

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Ghi nhận vật tư đã dùng, chụp ảnh minh chứng bắt buộc |
| **Actor** | CVLĐ |
| **URL** | `/staff/tasks/{taskId}/execute` |
| **UC liên quan** | UC-CVLD05, UC-CVLD06, US6.4 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Vật tư đã dùng | Dynamic Form | Thêm dòng: Tên vật tư, Số lượng, Đơn vị |
| 2 | Chụp/Upload ảnh | Camera + File Upload | **Bắt buộc ≥ 1 ảnh** (dùng camera điện thoại) |
| 3 | Ghi chú hiện trạng | Textarea | Ghi chú bất thường (sâu hại, lá vàng...) |
| 4 | Nút "Hoàn thành" | Button (Success) | → SCR-CVLD-04 (Disabled nếu chưa có ảnh) |

**Business Rules:** BR15 (Bắt buộc ≥ 1 ảnh), BR17 (Tự động đồng bộ Farm Diary).

---

### SCR-CVLD-04: Xác nhận hoàn thành Task

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Review lại thông tin trước khi đóng task |
| **Actor** | CVLĐ |
| **URL** | `/staff/tasks/{taskId}/confirm` |
| **UC liên quan** | UC-CVLD07, US6.5 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Tóm tắt | Summary Card | Tên task, Vật tư đã dùng, Ảnh đã chụp |
| 2 | Nút "Xác nhận hoàn thành" | Button (Primary) | Task → COMPLETED, Tạo FarmDiary entry, Thông báo KH |

---

### SCR-CVLD-05: Tạo Issue Report

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Báo cáo sự cố bất thường tại vườn |
| **Actor** | CVLĐ |
| **URL** | `/staff/issues/new` |
| **UC liên quan** | UC-CVLD08, US6.6 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Chọn Plot | Dropdown | Plot đang phụ trách |
| 2 | Loại sự cố | Dropdown | Sâu bệnh / Hỏng giàn / Thiếu nước / Khác |
| 3 | Mô tả | Textarea | Chi tiết sự cố |
| 4 | Chụp ảnh | Camera + File Upload | ≥ 1 ảnh sự cố |
| 5 | Nút "Gửi báo cáo" | Button | Tạo Issue Report → Thông báo CGNN |

---

### SCR-CVLD-06: Chat với CGNN

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Trao đổi kỹ thuật trực tiếp với CGNN |
| **Actor** | CVLĐ ↔ CGNN |
| **URL** | `/staff/issues/{issueId}/chat` |
| **UC liên quan** | UC-CVLD09, US6.6 |

**Thành phần UI:** Chat Window (tương tự SCR-KH-12 nhưng kênh CVLĐ ↔ CGNN).

---

### SCR-CVLD-07: Thu hoạch & Cân đo nông sản

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Cắt, cân đo điện tử, đóng gói nông sản và chụp ảnh minh chứng ghi nhận Harvest Result |
| **Actor** | CVLĐ (Assisted-growing) |
| **URL** | `/staff/harvest/{rentalId}` |
| **UC liên quan** | UC-CVLD10, US9.1 |

**Thành phần UI:**

| # | Component | Loại | Mô tả |
|---|---|---|---|
| 1 | Thông tin Hợp đồng | Info Card | Plot, KH, Cây trồng |
| 2 | Sản lượng thực tế (kg) | Number Input | Nhập số kg cân được (bắt buộc > 0) |
| 3 | Ảnh chụp cân điện tử & sọt rau | Camera + Upload | Chụp ảnh rõ màn hình cân điện tử và sọt nông sản làm minh chứng (bắt buộc) |
| 4 | Ghi chú chất lượng | Textarea | Nhận xét độ tươi, tỷ lệ hao hụt nếu có |
| 5 | Nút "Ghi nhận kết quả" | Button (Primary) | Lưu Harvest Result → Thông báo gửi đến KH để nghiệm thu |

---

### SCR-CVLD-08: Lịch sử công việc

| Thuộc tính | Mô tả |
|---|---|
| **Mục đích** | Tra cứu task đã hoàn thành phục vụ chấm công |
| **Actor** | CVLĐ |
| **URL** | `/staff/history` |
| **UC liên quan** | UC-CVLD11, US9.3 |

**Thành phần UI:** Data Table (Task, Plot, Ngày, Vật tư, Ảnh) + Filter theo tháng.

---

## ĐỐI CHIẾU: SCREEN ↔ USE CASE ↔ USER STORY

| Màn hình | Use Case | User Story |
|---|---|---|
| SCR-PUB-01 → PUB-04 | UC-KH01 | US1.1, US1.2 |
| SCR-KH-01 | UC-KH11 | US7.1 |
| SCR-KH-02 | UC-KH02 | US3.1 |
| SCR-KH-03 | UC-KH03 | US3.2 |
| SCR-KH-04 | UC-KH05, KH06 | US3.4, US3.5 |
| SCR-KH-05 | UC-KH07 | US3.6 |
| SCR-KH-06 | UC-KH08, KH09 | US5.1 |
| SCR-KH-07 | UC-KH10 | US5.4 |
| SCR-KH-08 | UC-KH13 | US7.2 |
| SCR-KH-09 | UC-KH14 | US7.3 |
| SCR-KH-10 | UC-KH11, KH12 | US7.4, US7.6 |
| SCR-KH-11 | UC-KH15 | US7.5 |
| SCR-KH-12 | UC-KH16 | US8.1, US8.2 |
| SCR-KH-13 | UC-KH17 | US8.4 |
| SCR-KH-14 | UC-KH19 | US9.1 |
| SCR-KH-15 | UC-KH20 | US9.2 |
| SCR-AD-01 | UC-AD12 | US9.4 |
| SCR-AD-02 | UC-AD01, AD02 | US1.4 |
| SCR-AD-03 | UC-AD03 | US2.1 |
| SCR-AD-04 | UC-AD04, AD05 | US2.2 |
| SCR-AD-05 | UC-AD09 | US2.4 |
| SCR-AD-06 | UC-AD07 | US9.4 |
| SCR-AD-07 | UC-AD08 | US6.1 |
| SCR-AD-08 | UC-AD10 | US6.2 |
| SCR-AD-09 | UC-AD11 | US7.7 |
| SCR-AD-10 | UC-AD13 | US9.5 |
| SCR-CGNN-01 | — | — |
| SCR-CGNN-02 | UC-CGNN01, CGNN02 | US4.1 |
| SCR-CGNN-03 | UC-CGNN03 | US4.2 |
| SCR-CGNN-04 | UC-CGNN04–CGNN08 | US4.3, US4.4, US4.5 |
| SCR-CGNN-05 | UC-CGNN09 | US4.6 |
| SCR-CGNN-06 | UC-CGNN11 | US5.3 |
| SCR-CGNN-07 | UC-CGNN12 | US5.5 |
| SCR-CGNN-08 | UC-CGNN13 | US8.2 |
| SCR-CGNN-09 | UC-CGNN14, CGNN15 | US8.3 |
| SCR-CVLD-01 | UC-CVLD01 | US6.3 |
| SCR-CVLD-02 | UC-CVLD02, CVLD03 | US6.3 |
| SCR-CVLD-03 | UC-CVLD05, CVLD06 | US6.4 |
| SCR-CVLD-04 | UC-CVLD07 | US6.5 |
| SCR-CVLD-05 | UC-CVLD08 | US6.6 |
| SCR-CVLD-06 | UC-CVLD09 | US6.6 |
| SCR-CVLD-07 | UC-CVLD10 | US9.1 |
| SCR-CVLD-08 | UC-CVLD11 | US9.3 |
