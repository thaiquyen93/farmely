# FARMELY – Nền tảng Thuê Plot & Theo dõi Trải nghiệm Canh tác

## Software Requirement Specification (SRS)

**Môn học:** ISP392 – Information System Planning  
**Trường:** Đại học FPT – Hà Nội  
**Nhóm:** Group 1  
**Phiên bản:** 1.0  
**Ngày:** Tháng 10, 2026

---

## Record of Changes

| Ngày | A/M/D | Phụ trách | Mô tả thay đổi |
|:-----|:------|:----------|:----------------|
| 01/Oct/2026 | A | Nguyên | Khởi tạo SRS Document v1.0 – toàn bộ nội dung |

*A – Added, M – Modified, D – Deleted*

---

## Mục lục

- [I. Overview](#i-overview)
  - [1. Introduction](#1-introduction)
  - [2. System Functions](#2-system-functions)
  - [3. Entity Relationship Diagram](#3-entity-relationship-diagram)
- [II. Functional Requirements](#ii-functional-requirements)
  - [1. Quản lý Tài khoản & Xác thực](#1-quản-lý-tài-khoản--xác-thực)
  - [2. Marketplace & Quản lý Plot](#2-marketplace--quản-lý-plot)
  - [3. Đặt hàng & Thanh toán](#3-đặt-hàng--thanh-toán)
  - [4. Quy trình Canh tác & Kế hoạch](#4-quy-trình-canh-tác--kế-hoạch)
  - [5. Vận hành & Chăm sóc](#5-vận-hành--chăm-sóc)
  - [6. Giám sát IoT & Thông báo](#6-giám-sát-iot--thông-báo)
  - [7. Nhật ký & Thu hoạch](#7-nhật-ký--thu-hoạch)
  - [8. Hệ thống Trò chuyện](#8-hệ-thống-trò-chuyện)
  - [9. Tri thức Nông nghiệp](#9-tri-thức-nông-nghiệp)
  - [10. Quản trị Hệ thống](#10-quản-trị-hệ-thống)

---

# I. Overview

## 1. Introduction

### 1.1 Tổng quan sản phẩm

**Farmely** là nền tảng AgriTech (Công nghệ Nông nghiệp) cho phép khách hàng thuê các ô đất canh tác (plot) và theo dõi toàn bộ trải nghiệm canh tác từ xa. Hệ thống hướng đến mô hình "Farm-as-a-Service", kết nối người tiêu dùng thành thị với nông trại thực tế thông qua công nghệ IoT và quản lý quy trình số hóa chuẩn nông nghiệp.

Hệ thống kết nối bốn nhóm người dùng chính:

- **Khách hàng (KH):** Thuê plot, chọn cây trồng, theo dõi quá trình canh tác qua dashboard, nhận kết quả thu hoạch.
- **Chuyên gia Nông nghiệp (CGNN):** Thiết kế quy trình canh tác mẫu (process template), cấu hình ngưỡng IoT, phê duyệt kế hoạch, hỗ trợ kỹ thuật qua chat.
- **Công nhân Vận hành (CVLĐ):** Thực hiện các công việc chăm sóc (care tasks) trên đồng, ghi nhận vật tư sử dụng, báo cáo sự cố, hỗ trợ thu hoạch.
- **Quản trị viên (Admin/AD):** Quản lý toàn bộ hệ thống – người dùng, đất đai, đơn hàng, thanh toán, audit log.

### 1.2 Ngữ cảnh hệ thống

Hệ thống Farmely tương tác với các thực thể bên ngoài:

| Thực thể bên ngoài | Loại | Mô tả tương tác |
|:--------------------|:-----|:-----------------|
| Khách hàng (KH) | Human | Duyệt plot, đặt thuê, theo dõi canh tác, nhận thông báo, chat |
| Chuyên gia NN (CGNN) | Human | Tạo/quản lý quy trình, phê duyệt kế hoạch, hỗ trợ kỹ thuật |
| Công nhân VH (CVLĐ) | Human | Thực hiện care tasks, ghi nhận thu hoạch, báo cáo sự cố |
| Quản trị viên (AD) | Human | Quản lý users, lands, plots, orders, payments, audit |
| Payment Gateway | System | Xử lý thanh toán trực tuyến (VNPay/Momo) |
| IoT Sensor System | System | Thu thập dữ liệu cảm biến (nhiệt độ, độ ẩm) – chế độ Mock mỗi 3h |
| Weather Service | System | Cung cấp dữ liệu thời tiết cho vùng canh tác |
| AI Service | System | Dịch vụ hỏi đáp kỹ thuật nông nghiệp 24/7 qua Chatbot cho khách hàng |

### 1.3 Giả định & Ràng buộc

- DBMS chính: **Microsoft SQL Server** (lab FPT), song song **PostgreSQL 18** (máy cá nhân).
- CSDL tuân thủ **chuẩn 3NF** (Third Normal Form), 28 bảng vật lý.
- **Single Table Inheritance** cho bảng `users` với `role_id` phân quyền (1 bảng users, 1 bảng roles).
- Không sử dụng JSON trong cột CSDL; bảng `material_usages` đảm bảo 1NF.
- Bảng `orders` là giỏ hàng gom nhiều `rentals`.
- Giá trị tính toán (`total_rental_price`) KHÔNG lưu – tính runtime. Giá trị gom (`total_amount` trong `orders`) CÓ lưu.
- **Nguyên tắc hạ tầng IoT (Plot-centric, Farm-managed):** Thiết bị cảm biến vi khí hậu (nhiệt độ, độ ẩm đất) là phần cứng hạ tầng do trang trại lắp đặt cố định trên từng thửa đất (`plots`) ngay từ đầu, hoạt động đo đạc tự động độc lập với việc có khách thuê hay không (dữ liệu gắn chặt theo `plot_id` trong bảng `sensor_readings`). Khách hàng hoàn toàn KHÔNG tham gia lắp đặt hay cấu hình thiết bị; khách hàng chỉ có quyền xem (Read-only) các thông số môi trường của thửa đất mình đang thuê qua màn hình SCR-KH-10. Dữ liệu đo đạc trong phạm vi đồ án được tạo tự động bởi mô đun giả lập (Cron Job chu kỳ 3 giờ).

---

## 2. System Functions

### a. Screen Flow

Tổng cộng hệ thống có **47 màn hình**, chia thành 5 nhóm:

```
├── PUBLIC (4 màn hình)
│   ├── SCR-PUB-01: Trang chủ (Landing Page)
│   ├── SCR-PUB-02: Đăng ký tài khoản
│   ├── SCR-PUB-03: Đăng nhập
│   └── SCR-PUB-04: Quên mật khẩu
│
├── KHÁCH HÀNG – KH (17 màn hình)
│   ├── SCR-KH-01: Dashboard KH
│   ├── SCR-KH-02: Marketplace – Danh sách Plot
│   ├── SCR-KH-03: Chi tiết Plot
│   ├── SCR-KH-04: Đặt thuê Plot (Chọn Crop + Thời gian)
│   ├── SCR-KH-05: Thanh toán (Reservation + Mock Payment)
│   ├── SCR-KH-06: Chọn Hình thức canh tác (Self / Assisted)
│   ├── SCR-KH-07: Xem Cultivation Plan & Phê duyệt
│   ├── SCR-KH-08: Farm Diary Timeline
│   ├── SCR-KH-09: Tạo nhật ký mới (Self-growing)
│   ├── SCR-KH-10: Theo dõi Vi khí hậu Thửa đất (Read-only)
│   ├── SCR-KH-11: Đặt Service Request (Dịch vụ lẻ)
│   ├── SCR-KH-12: Chat tư vấn 1-1 với CGNN
│   ├── SCR-KH-13: AI Chatbot
│   ├── SCR-KH-14: Xác nhận thu hoạch (Harvest Result)
│   ├── SCR-KH-15: Lịch sử thuê (Read-only)
│   ├── SCR-KH-16: Hồ sơ cá nhân & Đổi mật khẩu
│   └── SCR-KH-17: Trung tâm thông báo
│
├── ADMINISTRATOR – AD (11 màn hình)
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
├── CHUYÊN GIA NÔNG NGHIỆP – CGNN (11 màn hình)
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
└── CÔNG NHÂN VẬN HÀNH – CVLĐ (8 màn hình)
    ├── SCR-CVLD-01: Dashboard CVLĐ (Danh sách task hôm nay)
    ├── SCR-CVLD-02: Chi tiết Care Task & Hướng dẫn KT
    ├── SCR-CVLD-03: Thực thi Task (Ghi vật tư + Chụp ảnh)
    ├── SCR-CVLD-04: Xác nhận hoàn thành Task
    ├── SCR-CVLD-05: Tạo Issue Report
    ├── SCR-CVLD-06: Chat với CGNN
    ├── SCR-CVLD-07: Hỗ trợ thu hoạch
    └── SCR-CVLD-08: Lịch sử công việc
```

### b. Screen Details

| # | Feature | Screen | Mô tả |
|:--|:--------|:-------|:------|
| 1 | Public | SCR-PUB-01: Trang chủ | Giới thiệu nền tảng, hiển thị Plot nổi bật, điều hướng đến Marketplace |
| 2 | Public | SCR-PUB-02: Đăng ký | Form tạo tài khoản KH mới (họ tên, email, SĐT, mật khẩu) |
| 3 | Public | SCR-PUB-03: Đăng nhập | Xác thực người dùng bằng email + mật khẩu, chuyển hướng theo role |
| 4 | Public | SCR-PUB-04: Quên mật khẩu | Gửi link reset mật khẩu qua email |
| 5 | KH | SCR-KH-01: Dashboard | Tổng quan: rental đang hoạt động, task sắp tới, thông báo mới |
| 6 | KH | SCR-KH-02: Marketplace | Danh sách plot AVAILABLE, bộ lọc (diện tích, giá, loại cây), sắp xếp |
| 7 | KH | SCR-KH-03: Chi tiết Plot | Thông tin plot chi tiết: ảnh, diện tích, giá, nguồn nước, cây trồng tương thích |
| 8 | KH | SCR-KH-04: Đặt thuê Plot | Chọn giống cây (variety), thời gian thuê, tính giá, tạo rental trong order |
| 9 | KH | SCR-KH-05: Thanh toán | Xác nhận order, chọn phương thức thanh toán, xử lý qua Payment Gateway |
| 10 | KH | SCR-KH-06: Chọn hình thức | Chọn Self-growing (tự trồng) hoặc Assisted (hỗ trợ chuyên gia) |
| 11 | KH | SCR-KH-07: Cultivation Plan | Xem kế hoạch canh tác chi tiết, phê duyệt/yêu cầu chỉnh sửa |
| 12 | KH | SCR-KH-08: Farm Diary | Timeline nhật ký canh tác: ảnh, ghi chú, vật tư đã dùng theo ngày |
| 13 | KH | SCR-KH-09: Tạo nhật ký | Form ghi nhật ký (Self-growing): mô tả, ảnh, ghi chú |
| 14 | KH | SCR-KH-10: Vi khí hậu Thửa đất | Xem thông số nhiệt độ, độ ẩm đo đạc sẵn từ plot đang thuê (read-only) + thời tiết |
| 15 | KH | SCR-KH-11: Service Request | Đặt dịch vụ lẻ (phun thuốc, bón phân bổ sung...) |
| 16 | KH | SCR-KH-12: Chat CGNN | Chat 1-1 tư vấn kỹ thuật với chuyên gia nông nghiệp |
| 17 | KH | SCR-KH-13: AI Chatbot | Hỏi đáp tự động về kỹ thuật canh tác qua AI |
| 18 | KH | SCR-KH-14: Thu hoạch | Xác nhận kết quả thu hoạch: số lượng, chất lượng, ảnh |
| 19 | KH | SCR-KH-15: Lịch sử thuê | Danh sách rental đã hoàn thành (read-only) |
| 20 | KH | SCR-KH-16: Hồ sơ cá nhân | Xem/sửa thông tin cá nhân, đổi mật khẩu |
| 21 | KH | SCR-KH-17: Thông báo | Danh sách notification: task hoàn thành, cảnh báo IoT, tin nhắn mới |
| 22 | AD | SCR-AD-01: Dashboard | Thống kê tổng hợp: doanh thu, số rental, cảnh báo, biểu đồ |
| 23 | AD | SCR-AD-02: Quản lý User | CRUD users, gán role, khóa/mở tài khoản (RBAC) |
| 24 | AD | SCR-AD-03: Quản lý Land | CRUD lands: tên, vị trí, danh sách plot thuộc land |
| 25 | AD | SCR-AD-04: Quản lý Plot | CRUD plots: mã plot, diện tích, giá, ảnh, trạng thái, gắn IoT |
| 26 | AD | SCR-AD-05: Marketplace Config | Publish/Hide plot trên marketplace |
| 27 | AD | SCR-AD-06: Danh mục dịch vụ | Quản lý danh mục service request (dịch vụ phát sinh) |
| 28 | AD | SCR-AD-07: Giám sát Rental | Xem danh sách order/rental, trạng thái thanh toán |
| 29 | AD | SCR-AD-08: Phân công Task | Phân công care task từ cultivation plan cho CVLĐ |
| 30 | AD | SCR-AD-09: Service Request | Tiếp nhận, phân công service request cho CVLĐ |
| 31 | AD | SCR-AD-10: Cảnh báo IoT | Giám sát cảnh báo khi sensor vượt ngưỡng |
| 32 | AD | SCR-AD-11: Audit Log | Tra cứu lịch sử thao tác hệ thống (ai, làm gì, khi nào) |
| 33 | CGNN | SCR-CGNN-01: Dashboard | Tổng quan: template cần review, plan chờ duyệt, issue report |
| 34 | CGNN | SCR-CGNN-02: Crop & Variety | CRUD cây trồng (crop) và giống (variety): tên, thời gian dự kiến |
| 35 | CGNN | SCR-CGNN-03: Compatibility | Thiết lập plot–crop compatibility: plot nào trồng được giống nào |
| 36 | CGNN | SCR-CGNN-04: Process Template | Soạn quy trình canh tác mẫu: các bước (step), vật tư, thời gian |
| 37 | CGNN | SCR-CGNN-05: Ngưỡng IoT | Cấu hình min/max nhiệt độ, độ ẩm theo từng giai đoạn template |
| 38 | CGNN | SCR-CGNN-06: Tài liệu KN | Upload/quản lý tài liệu hướng dẫn kỹ thuật nông nghiệp |
| 39 | CGNN | SCR-CGNN-07: Lập & Hiệu chỉnh Kế hoạch | Tinh chỉnh kế hoạch canh tác từ quy trình chuẩn trước khi gửi KH duyệt |
| 40 | CGNN | SCR-CGNN-08: Plan Revision | Đề xuất thay đổi cultivation plan đang hoạt động |
| 41 | CGNN | SCR-CGNN-09: Chat KH | Chat tư vấn 1-1 với khách hàng |
| 42 | CGNN | SCR-CGNN-10: Issue Report | Tiếp nhận báo cáo sự cố từ CVLĐ, chat hỗ trợ kỹ thuật |
| 43 | CGNN | SCR-CGNN-11: Tư vấn Pre-rental | Tư vấn KH trước khi thuê: chọn cây phù hợp, thời vụ |
| 44 | CVLĐ | SCR-CVLD-01: Dashboard | Danh sách care task được giao hôm nay, trạng thái |
| 45 | CVLĐ | SCR-CVLD-02: Chi tiết Task | Xem chi tiết task: hướng dẫn kỹ thuật, vật tư cần dùng |
| 46 | CVLĐ | SCR-CVLD-03: Thực thi Task | Ghi nhận: vật tư thực tế sử dụng, chụp ảnh minh chứng |
| 47 | CVLĐ | SCR-CVLD-04: Hoàn thành Task | Xác nhận hoàn thành task, ghi chú kết quả |
| 48 | CVLĐ | SCR-CVLD-05: Issue Report | Báo cáo sự cố phát hiện trên đồng: mô tả, ảnh, mức độ |
| 49 | CVLĐ | SCR-CVLD-06: Chat CGNN | Chat với chuyên gia để nhận hướng dẫn kỹ thuật |
| 50 | CVLĐ | SCR-CVLD-07: Thu hoạch | Ghi nhận kết quả thu hoạch: sản lượng, chất lượng, ảnh |
| 51 | CVLĐ | SCR-CVLD-08: Lịch sử | Xem lại các task đã hoàn thành trước đó |

### c. User Authorization

| Screen | KH | CGNN | CVLĐ | AD |
|:-------|:--:|:----:|:----:|:--:|
| **PUBLIC** | | | | |
| SCR-PUB-01: Trang chủ | ✓ | ✓ | ✓ | ✓ |
| SCR-PUB-02: Đăng ký | ✓ | — | — | — |
| SCR-PUB-03: Đăng nhập | ✓ | ✓ | ✓ | ✓ |
| SCR-PUB-04: Quên mật khẩu | ✓ | ✓ | ✓ | ✓ |
| **KHÁCH HÀNG** | | | | |
| SCR-KH-01: Dashboard KH | ✓ | — | — | — |
| SCR-KH-02: Marketplace | ✓ | — | — | — |
| SCR-KH-03: Chi tiết Plot | ✓ | — | — | — |
| SCR-KH-04: Đặt thuê Plot | ✓ | — | — | — |
| SCR-KH-05: Thanh toán | ✓ | — | — | — |
| SCR-KH-06: Chọn hình thức | ✓ | — | — | — |
| SCR-KH-07: Cultivation Plan | ✓ | — | — | — |
| SCR-KH-08: Farm Diary | ✓ | — | — | — |
| SCR-KH-09: Tạo nhật ký | ✓ | — | — | — |
| SCR-KH-10: Vi khí hậu Thửa đất | ✓ | — | — | — |
| SCR-KH-11: Service Request | ✓ | — | — | — |
| SCR-KH-12: Chat CGNN | ✓ | — | — | — |
| SCR-KH-13: AI Chatbot | ✓ | — | — | — |
| SCR-KH-14: Thu hoạch | ✓ | — | — | — |
| SCR-KH-15: Lịch sử thuê | ✓ | — | — | — |
| SCR-KH-16: Hồ sơ cá nhân | ✓ | — | — | — |
| SCR-KH-17: Thông báo | ✓ | — | — | — |
| **ADMIN** | | | | |
| SCR-AD-01: Dashboard AD | — | — | — | ✓ |
| SCR-AD-02: Quản lý User | — | — | — | ✓ |
| SCR-AD-03: Quản lý Land | — | — | — | ✓ |
| SCR-AD-04: Quản lý Plot | — | — | — | ✓ |
| SCR-AD-05: Marketplace Config | — | — | — | ✓ |
| SCR-AD-06: Danh mục dịch vụ | — | — | — | ✓ |
| SCR-AD-07: Giám sát Rental | — | — | — | ✓ |
| SCR-AD-08: Phân công Task | — | — | — | ✓ |
| SCR-AD-09: Service Request | — | — | — | ✓ |
| SCR-AD-10: Cảnh báo IoT | — | — | — | ✓ |
| SCR-AD-11: Audit Log | — | — | — | ✓ |
| **CHUYÊN GIA NN** | | | | |
| SCR-CGNN-01: Dashboard CGNN | — | ✓ | — | — |
| SCR-CGNN-02: Crop & Variety | — | ✓ | — | — |
| SCR-CGNN-03: Compatibility | — | ✓ | — | — |
| SCR-CGNN-04: Process Template | — | ✓ | — | — |
| SCR-CGNN-05: Ngưỡng IoT | — | ✓ | — | — |
| SCR-CGNN-06: Tài liệu KN | — | ✓ | — | — |
| SCR-CGNN-07: Lập & Hiệu chỉnh Kế hoạch | — | ✓ | — | — |
| SCR-CGNN-08: Plan Revision | — | ✓ | — | — |
| SCR-CGNN-09: Chat KH | — | ✓ | — | — |
| SCR-CGNN-10: Issue Report | — | ✓ | — | — |
| SCR-CGNN-11: Tư vấn Pre-rental | — | ✓ | — | — |
| **CÔNG NHÂN VẬN HÀNH** | | | | |
| SCR-CVLD-01: Dashboard CVLĐ | — | — | ✓ | — |
| SCR-CVLD-02: Chi tiết Task | — | — | ✓ | — |
| SCR-CVLD-03: Thực thi Task | — | — | ✓ | — |
| SCR-CVLD-04: Hoàn thành Task | — | — | ✓ | — |
| SCR-CVLD-05: Issue Report | — | — | ✓ | — |
| SCR-CVLD-06: Chat CGNN | — | — | ✓ | — |
| SCR-CVLD-07: Thu hoạch | — | — | ✓ | — |
| SCR-CVLD-08: Lịch sử | — | — | ✓ | — |

**Chú thích vai trò:**
- **KH (Khách hàng):** Người thuê plot, trải nghiệm canh tác, theo dõi từ xa.
- **CGNN (Chuyên gia Nông nghiệp):** Chuyên gia kỹ thuật, thiết kế quy trình, tư vấn.
- **CVLĐ (Công nhân Vận hành):** Đội đồng, thực hiện chăm sóc thực tế.
- **AD (Admin):** Quản trị viên hệ thống, toàn quyền quản lý.

### d. Non-Screen Functions

| # | Feature | System Function | Mô tả |
|:--|:--------|:----------------|:------|
| 1 | IoT Monitoring | IoT Data Simulator (Cron Job) | Sinh dữ liệu mock sensor (nhiệt độ, độ ẩm) mỗi 3 giờ cho mỗi plot đang hoạt động, lưu vào bảng `sensor_readings` |
| 2 | IoT Monitoring | Alert Trigger Service | So sánh giá trị sensor với ngưỡng trong `process_templates` (min/max temp, humidity). Nếu vượt ngưỡng → tạo notification cảnh báo |
| 3 | Notification | Notification Dispatcher | Tạo và phân phối notification đến user tương ứng khi có sự kiện: task hoàn thành, cảnh báo IoT, tin nhắn mới, payment thành công |
| 4 | Payment | Payment Callback Handler (API) | Nhận callback từ Payment Gateway (VNPay/Momo) để cập nhật trạng thái `payment_transactions` |
| 5 | Audit | Audit Logger (Service) | Ghi log mọi thao tác quan trọng (CRUD users, orders, payments) vào bảng `audit_logs` với thông tin: ai, hành động, đối tượng, thời gian |
| 6 | Plan | Auto-Generate Care Tasks | Khi cultivation plan được phê duyệt, tự động tạo các `care_tasks` từ `template_steps` + `template_materials`, gán cho CVLĐ |
| 7 | Cultivation | Auto-Instantiate Plan | Khi Rental chuyển CONFIRMED (Assisted mode), hệ thống tự động khởi tạo Cultivation Plan từ Standard Process Template tương ứng của giống cây để CGNN tinh chỉnh |

---

## 3. Entity Relationship Diagram

> *Tham khảo file ERD chi tiết:* `docs/diagrams/erd/ERD TU VE 2.0.drawio` (28 bảng, 40 FK edges, 6 vùng màu)

### Entities Description

| # | Entity (Table) | Mô tả |
|:--|:---------------|:------|
| 1 | `roles` | Danh mục vai trò hệ thống (KH, CGNN, CVLĐ, AD) |
| 2 | `users` | Thông tin người dùng: email, password_hash, full_name, phone, role_id, status |
| 3 | `lands` | Vùng đất canh tác: tên, địa chỉ, GPS, thông tin thổ nhưỡng chung |
| 4 | `plots` | Ô đất cụ thể trong land: mã plot, diện tích, giá/kỳ, nguồn nước, trạng thái (AVAILABLE/MAINTENANCE/RENTED) |
| 5 | `site_visits` | Lịch hẹn tham quan xem đất trực tiếp tại vườn (cho cả Guest và Khách hàng) |
| 6 | `crops` | Loại cây trồng: tên nhóm cây |
| 7 | `varieties` | Giống cây kiểm định: thuộc crop, tên giống, thời gian sinh trưởng, buffer_time |
| 8 | `plot_crop_compatibility` | Bảng liên kết N-N: plot nào phù hợp trồng giống variety nào |
| 9 | `process_templates` | Quy trình canh tác chuẩn nông học: thuộc variety, CGNN thiết lập, version |
| 10 | `template_steps` | Các bước kỹ thuật trong quy trình: thứ tự, tên, mô tả, day_offset, thời lượng |
| 11 | `materials` | Danh mục vật tư nông nghiệp: tên phân bón/chế phẩm, đơn vị tính |
| 12 | `template_materials` | Định mức vật tư chuẩn cho từng bước kỹ thuật theo quy trình của CGNN |
| 13 | `services` | Bảng Master danh mục dịch vụ niêm yết (Dịch vụ lẻ & Gói ủy thác chăm sóc trọn gói 30 ngày) |
| 14 | `contracts` | Hợp đồng thuê thửa đất: contract_code, plot_id, variety_id, start/end_date, total_price, parent_contract_id (Renew) |
| 15 | `service_requests` | Yêu cầu dịch vụ phát sinh hoặc gói ủy thác chăm sóc gắn với Hợp đồng |
| 16 | `cancellation_requests` | Yêu cầu hủy hợp đồng: tiếp nhận lý do, thẩm định tỷ lệ khấu trừ (20%/50%) trước khi hoàn tiền |
| 17 | `payment_transactions` | Giao dịch tài chính: contract_id, số tiền, loại giao dịch (PAYMENT/REFUND), mã giao dịch cổng thanh toán |
| 18 | `care_tasks` | Nhiệm vụ chăm sóc ngoài vườn: contract_id, template_step_id, assigned_worker_id, ngày thực hiện, trạng thái |
| 19 | `material_usages` | Vật tư thực tế sử dụng: care_task_id, material_id, số lượng thực tế (đảm bảo chuẩn 1NF) |
| 20 | `harvest_results` | Kết quả thu hoạch: contract_id, staff_id (CVLĐ trực tiếp cân đo), sản lượng kg, ảnh cân điện tử, hình thức nhận |
| 21 | `issue_reports` | Báo cáo sự cố thực địa: contract_id, người báo cáo, mô tả sâu bệnh, mức độ nghiêm trọng |
| 22 | `farm_diaries` | Nhật ký canh tác: contract_id, tác giả, ngày ghi, mô tả, ảnh hiện trường |
| 23 | `sensor_readings` | Dữ liệu vi khí hậu đo đạc tự động từ trạm cảm biến lắp sẵn trên plot (nhiệt độ, độ ẩm) |
| 24 | `knowledge_documents` | Kho tài liệu chuyên môn làm cơ sở dữ liệu tri thức RAG cho AI Chatbot |
| 25 | `conversations` | Phiên trò chuyện: giữa 2 user (KH ↔ CGNN, CVLĐ ↔ CGNN) |
| 26 | `messages` | Tin nhắn trong cuộc hội thoại: nội dung văn bản, hình ảnh, thời gian gửi |
| 27 | `notifications` | Thông báo đẩy trong hệ thống: user_id, loại thông báo, nội dung, trạng thái |
| 28 | `audit_logs` | Nhật ký kiểm toán bảo mật: user_id, hành động, đối tượng, thời gian, chi tiết IP/User-agent |

---

---

# II. Functional Requirements

## 1. Quản lý Tài khoản & Xác thực

### a. Đăng ký tài khoản (SCR-PUB-02)

**Function trigger:** Người dùng click "Đăng ký" từ trang chủ (SCR-PUB-01) hoặc link "Chưa có tài khoản?" từ trang đăng nhập (SCR-PUB-03) → Điều hướng đến `/register`.

**Function description:** Cho phép Guest tạo tài khoản Khách hàng (KH) mới. Hệ thống tự động gán `ROLE_CUSTOMER`. Chỉ KH tự đăng ký; CGNN, CVLĐ do Admin tạo tại SCR-AD-02.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-PUB-02*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Default | Note |
|:--|:------|:-----|:---------|:-----------|:--------|:-----|
| 1 | Họ và tên | Text | Có | Min 2 ký tự, max 100 | — | `users.full_name` |
| 2 | Email | Email | Có | Format email hợp lệ, unique trong DB | — | `users.email` – dùng để đăng nhập |
| 3 | Số điện thoại | Tel | Có | Đúng 10 chữ số (VN), unique | — | `users.phone` |
| 4 | Mật khẩu | Password | Có | ≥ 8 ký tự, chứa chữ hoa + chữ thường + số | — | Hash bcrypt → `users.password_hash` |
| 5 | Xác nhận MK | Password | Có | Phải khớp trường Mật khẩu | — | Không lưu DB |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V1.1 | Họ và tên | Không rỗng, 2–100 ký tự |
| V1.2 | Email | Regex email hợp lệ, kiểm tra unique qua `GET /api/users/check-email` |
| V1.3 | SĐT | Regex `^0[0-9]{9}$`, kiểm tra unique |
| V1.4 | Mật khẩu | ≥ 8 ký tự, chứa ≥ 1 chữ hoa, ≥ 1 chữ thường, ≥ 1 số |
| V1.5 | Xác nhận MK | Giá trị == Mật khẩu |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M1.1 | Email đã tồn tại | "Email này đã được sử dụng" | Error (inline) |
| M1.2 | SĐT đã tồn tại | "Số điện thoại đã được đăng ký" | Error (inline) |
| M1.3 | Mật khẩu yếu | "Mật khẩu phải có ít nhất 8 ký tự gồm chữ hoa, chữ thường và số" | Error (inline) |
| M1.4 | MK không khớp | "Mật khẩu xác nhận không khớp" | Error (inline) |
| M1.5 | Đăng ký thành công | "Đăng ký thành công! Vui lòng đăng nhập." | Success (toast) |
| M1.6 | Server error | "Có lỗi xảy ra, vui lòng thử lại sau" | Error (toast) |

*Additional Logic:*

1. Password hash bằng bcrypt (cost factor = 12) → `users.password_hash`.
2. Tài khoản mới: `role_id` = ROLE_CUSTOMER, `status` = ACTIVE.
3. Đăng ký thành công → redirect SCR-PUB-03.
4. Validate client-side trước, server-side sau – cả hai bắt buộc.

---

### b. Đăng nhập (SCR-PUB-03)

**Function trigger:** Click "Đăng nhập" từ navbar hoặc link từ SCR-PUB-02 → `/login`.

**Function description:** Xác thực email + mật khẩu → JWT Token → redirect dashboard theo role.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-PUB-03*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint |
|:--|:------|:-----|:---------|:-----------|
| 1 | Email | Email | Có | Format email hợp lệ |
| 2 | Mật khẩu | Password | Có | Không rỗng |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V2.1 | Email | Format email hợp lệ |
| V2.2 | Mật khẩu | Không rỗng |
| V2.3 | Cặp Email/MK | So khớp password_hash trong DB |
| V2.4 | Trạng thái TK | `users.status` = ACTIVE |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M2.1 | Sai email hoặc MK | "Email hoặc mật khẩu không đúng" | Error |
| M2.2 | TK bị khóa | "Tài khoản đã bị khóa, vui lòng liên hệ Admin" | Error |

*Additional Logic:*

1. **Không tiết lộ** trường nào sai – luôn hiện M2.1 (bảo mật).
2. Redirect: KH → `/customer/dashboard`, CGNN → `/expert/dashboard`, CVLĐ → `/staff/dashboard`, AD → `/admin/dashboard`.
3. JWT Token lưu httpOnly cookie hoặc localStorage.

---

### c. Quên mật khẩu (SCR-PUB-04)

**Function trigger:** Click "Quên mật khẩu?" từ SCR-PUB-03 → `/forgot-password`.

**Function description:** Nhập email → gửi link reset (token hết hạn 30 phút) → trang đặt MK mới + xác nhận.

---

### d. Đặt lịch xem đất thực tế (SCR-PUB-05)

**Function trigger:** Người dùng (Khách vãng lai chưa có tài khoản hoặc Khách hàng tiềm năng) bấm nút "Đặt lịch xem đất" từ trang chủ (SCR-PUB-01) hoặc màn hình Chi tiết Plot (SCR-KH-03) để mở form tại URL `/site-visit/book`.

**Function description:** Cho phép Guest hoặc Khách hàng đăng ký lịch hẹn tham quan trực tiếp nông trại để xem vị trí và hiện trạng thửa đất trước khi quyết định thuê. Khách vãng lai chỉ cần cung cấp Họ tên, Số điện thoại và Email liên hệ để bộ phận kinh doanh tiếp nhận (Leads).

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-PUB-05*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Họ và tên | Text | Có | 2–100 ký tự | `site_visits.guest_name` |
| 2 | Số điện thoại | Tel | Có | Format 10 chữ số VN | `site_visits.guest_phone` |
| 3 | Email liên hệ | Email | — | Format email hợp lệ | `site_visits.guest_email` |
| 4 | Ngày tham quan | Date Picker | Có | ≥ ngày mai | `site_visits.visit_date` |
| 5 | Khung giờ | Radio | Có | Ca sáng (08:30–10:30) / Ca chiều (14:30–16:30) | `site_visits.time_slot` |
| 6 | Thửa đất quan tâm | Dropdown | — | Danh sách Plot AVAILABLE | `site_visits.plot_id` |
| 7 | Ghi chú nhu cầu | Textarea | — | Nhu cầu canh tác | `site_visits.notes` |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V5.1 | Họ tên & SĐT | Bắt buộc nhập, SĐT đúng định dạng 10 số |
| V5.2 | Ngày tham quan | Phải từ ngày mai trở đi (không đặt lịch quá khứ/trong ngày) |

*Additional Logic:*

1. Guest không bắt buộc phải đăng nhập. Nếu khách đã đăng nhập, hệ thống tự điền thông tin và gắn `customer_id`.
2. Submit thành công → Lưu vào `site_visits` (status = PENDING) → Gửi SMS/Email xác nhận hẹn → Notification cho Sales/Admin tiếp đón.

---

## 2. Marketplace & Hợp đồng Thuê Plot

### a. Marketplace – Danh sách Plot (SCR-KH-02)

**Function trigger:** Khách hàng click chọn mục "Marketplace" từ menu thanh điều hướng để truy cập danh sách thửa đất tại URL `/marketplace`.

**Function description:** Card grid các plot `status=AVAILABLE`, `listing=Published`. Tìm kiếm, lọc (khu đất, diện tích, giá, loại cây), sắp xếp, phân trang.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-KH-02*

**Function Details:**

| # | Component | Mô tả |
|:--|:----------|:------|
| 1 | Thanh tìm kiếm | Tìm theo tên Plot, khu đất. Debounce 300ms |
| 2 | Bộ lọc | Khu đất (Dropdown), Diện tích (Slider), Giá (Slider), Loại cây (Multi-select) |
| 3 | Card Grid | Ảnh, Mã Plot, Diện tích, Giá/tháng, Nhóm cây, Badge |
| 4 | Sắp xếp | Giá tăng/giảm, Diện tích, Mới nhất |
| 5 | Phân trang | 12 card/trang |

*Additional Logic:*

1. Chỉ plot `listing_status = Published`, `status = AVAILABLE`. Reserved/Rented ẩn.
2. Click card → SCR-KH-03.

---

### b. Chi tiết Plot (SCR-KH-03)

**Function trigger:** Khách hàng bấm chọn một thẻ thửa đất từ Marketplace để xem chi tiết thông số thổ nhưỡng, diện tích và giá thuê tại URL `/marketplace/plot/{plotId}`.

**Function description:** Ảnh gallery, thông số kỹ thuật, bảng giá thuê đất, danh mục giống cây tương thích (`plot_crop_compatibility`), thông số vi khí hậu đo đạc sẵn, dự báo thời tiết, lịch khả dụng.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-KH-03*

**Function Details:**

| # | Component | Mô tả |
|:--|:----------|:------|
| 1 | Thư viện ảnh | Image Gallery/Carousel (zoom) |
| 2 | Thông tin cơ bản | Mã Plot, Diện tích, Thổ nhưỡng, Nguồn nước |
| 3 | Bảng giá | Đơn giá thuê trọn gói (100% Upfront, không cọc) |
| 4 | Cây tương thích | Tag List giống cây kiểm định từ `plot_crop_compatibility` + thời gian sinh trưởng |
| 5 | Vi khí hậu hiện tại | 3 Gauge đo sẵn: Nhiệt độ, Ẩm đất, Ẩm khí (Read-only) |
| 6 | Thời tiết | Weather Widget: hôm nay + dự báo 3–5 ngày |
| 7 | Lịch khả dụng | Calendar: khoảng thời gian đã/chưa thuê |
| 8 | Nút "Thuê Plot này" | → SCR-KH-04 (chỉ kích hoạt khi đất AVAILABLE) |
| 9 | Nút "Đặt lịch xem đất" | Điều hướng sang form hẹn tham quan thực địa → SCR-PUB-05 |
| 10 | Nút "Hỏi Chuyên gia" | Tạo ticket tư vấn trước thuê PRE_RENTAL → SCR-KH-12 |

*Business Rules:* BR02, BR03 (Tương thích giống kiểm định), BR06 (Đặt lịch xem đất & Tư vấn tùy chọn).

---

### c. Ký kết Hợp đồng Thuê Plot (SCR-KH-04)

**Function trigger:** Khách hàng bấm nút "Thuê Plot này" tại màn hình Chi tiết Plot để mở form thiết lập điều khoản Hợp đồng tại URL `/marketplace/plot/{plotId}/book`.

**Function description:** Khách hàng chọn giống cây kiểm định, ngày bắt đầu thuê, hình thức canh tác (Tự trồng hoặc Ủy thác trọn gói). Hệ thống tự động tính ngày kết thúc, tổng giá trị hợp đồng (đã bao gồm 01 bộ Starter Kit miễn phí tháng đầu tiên) và tạo đơn giữ chỗ Reservation 15 phút.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-KH-04*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Thông tin Plot | Display | — | Read-only | Ảnh, mã, diện tích, giá thuê đất |
| 2 | Giống cây trồng | Dropdown | Có | Bắt buộc thuộc danh mục kiểm định của Farmely | `contracts.variety_id` |
| 3 | Ngày bắt đầu | Date Picker | Có | ≥ ngày mai, không trùng lịch | `contracts.start_date` |
| 4 | Ngày kết thúc | Display | — | Auto = start + duration + buffer | `contracts.end_date` |
| 5 | Hình thức canh tác | Radio | Có | Self-growing / Assisted-growing | `contracts.cultivation_mode` |
| 6 | Starter Kit | Display | — | Miễn phí 01 bộ F1 + giá thể tháng đầu (BR09) | Trọn gói |
| 7 | Tổng giá trị HĐ | Display | — | Tiền đất + Phí dịch vụ (nếu Assisted) | `contracts.total_price` |

*Validations:*

| ID | Validation Rule |
|:---|:----------------|
| V4.1 | Giống cây bắt buộc thuộc danh mục kiểm định tương thích (`plot_crop_compatibility`) (BR03) |
| V4.2 | Ngày bắt đầu ≥ ngày mai và không trùng lịch với hợp đồng khác trên Plot (BR07) |
| V4.3 | Thời lượng thuê ≥ thời gian sinh trưởng của cây + thời gian đệm buffer (BR04) |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M4.1 | Thời gian chưa đủ | "Thời gian thuê chưa đủ cho loại cây này (tối thiểu X ngày)" | Warning |
| M4.2 | Lịch trùng | "Plot đã được ký hợp đồng trong khoảng thời gian này" | Error |
| M4.3 | Reservation OK | "Đã lập hợp đồng giữ chỗ! Bạn có 15 phút để hoàn tất thanh toán." | Info |

*Additional Logic:*

1. Loại bỏ 100% bảng trung gian `Order` để triệt tiêu dư thừa amount. Tổng giá trị HĐ được lưu duy nhất tại `contracts.total_price`.
2. Submit → Khởi tạo `contracts` (status = RESERVED) → Chuyển hướng sang màn hình thanh toán SCR-KH-05.
3. Giữ chỗ có hiệu lực 15 phút (BR08). Quá thời gian mà chưa thanh toán, hệ thống tự hủy đơn giữ chỗ.

---

### d. Thanh toán Hợp đồng trọn gói (SCR-KH-05)

**Function trigger:** Sau khi hoàn tất thiết lập điều khoản Hợp đồng thuê tại SCR-KH-04, hệ thống tự động điều hướng sang trang thanh toán trực tuyến tại URL `/customer/payment/{contractId}`.

**Function description:** Hiển thị chi tiết hóa đơn Hợp đồng, đồng hồ đếm ngược 15 phút, lựa chọn cổng thanh toán trực tuyến. Thanh toán 100% trọn gói, không cọc.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-KH-05*

**Function Details:**

| # | Component | Mô tả |
|:--|:----------|:------|
| 1 | Đồng hồ đếm ngược | 15:00 → 00:00 (chuyển đỏ khi còn < 3 phút) |
| 2 | Chi tiết hóa đơn | Tiền thuê đất + Phí dịch vụ chăm sóc (nếu Assisted) + Bộ Starter Kit (0đ) |
| 3 | Tổng thanh toán | Hiển thị chính xác `contracts.total_price` |
| 4 | Cổng thanh toán | VNPay / MoMo / Thẻ ATM Nội địa & Quốc tế |
| 5 | Grace Period đệm | Tự động cộng thêm 03 phút ở trạng thái PAYMENT_PENDING khi KH chuyển sang cổng thanh toán |

*Additional Logic:*

1. Click "Thanh toán" → Hợp đồng chuyển sang `PAYMENT_PENDING`, cấp thêm 03 phút đệm (Grace Period - BR08) tránh bị hủy đơn khi khách đang nhập OTP ngân hàng.
2. Hệ thống tạo bản ghi `payment_transactions` (status = PENDING, transaction_type = PAYMENT, contract_id).
3. Thanh toán thành công (SUCCESS): `contracts.status` chuyển sang `CONFIRMED`. Khi đến đúng `start_date`, hợp đồng tự động chuyển sang `ACTIVE` và thửa đất chuyển sang `RENTED`.
4. *BR:* BR02, BR08 (15+3 phút), BR09 (100% trước, không cọc, tặng Starter Kit).

---

### e. Gia hạn Hợp đồng (Contract Renewal - SCR-KH-15)

**Function trigger:** Khách hàng từ Dashboard Hợp đồng đang hoạt động (ACTIVE), trước ngày kết thúc tối thiểu 07 ngày, bấm nút "Gia hạn hợp đồng (Renew)" để mở form tại URL `/customer/contract/{contractId}/renew`.

**Function description:** Cho phép khách hàng đang thuê thửa đất tiếp tục gia hạn thêm một mùa vụ nữa với cùng thửa đất và giống cây mà không cần làm thủ tục tìm kiếm lại từ đầu.

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Hợp đồng hiện tại | Display | — | Mã HĐ gốc, thửa đất, giống cây | Read-only |
| 2 | Ngày bắt đầu mới | Display | — | Tự động bằng `old_contract.end_date + 1` | `contracts.start_date` |
| 3 | Thời lượng gia hạn | Dropdown | Có | 1 tháng / 2 tháng / Cả mùa vụ | Tính ra `end_date` |
| 4 | Hình thức canh tác | Radio | Có | Kế thừa hoặc đổi Self/Assisted | `contracts.cultivation_mode` |
| 5 | Tổng tiền gia hạn | Display | — | Tính theo đơn giá niêm yết hiện hành | `contracts.total_price` |

*Additional Logic:*

1. Hệ thống tạo một bản ghi `contracts` mới với `parent_contract_id` trỏ về hợp đồng cũ.
2. Khách hàng thanh toán phí gia hạn trọn gói qua Payment Gateway.
3. Khi đến ngày bắt đầu của hợp đồng mới, hợp đồng cũ chuyển trạng thái sang `RENEWED` và hợp đồng mới chuyển sang `ACTIVE`, đảm bảo tính liên tục của quá trình canh tác và giữ trọn vẹn lịch sử nhật ký.

---

### f. Yêu cầu Hủy Hợp đồng & Hoàn tiền (SCR-KH-16)

**Function trigger:** Khách hàng từ chi tiết Hợp đồng chưa đến ngày bắt đầu (trạng thái CONFIRMED), bấm nút "Yêu cầu hủy hợp đồng" để mở form tại URL `/customer/contract/{contractId}/cancel`.

**Function description:** Cho phép khách hàng gửi đơn đề nghị hủy hợp đồng thuê trước ngày canh tác. Hệ thống tiếp nhận lý do, tự động áp dụng công thức tỷ lệ khấu trừ theo điều khoản hợp đồng và tính toán số tiền hoàn trả trước khi gửi Admin phê duyệt và kích hoạt lệnh REFUND.

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Mã hợp đồng | Display | — | Hợp đồng trạng thái CONFIRMED | `cancellation_requests.contract_id` |
| 2 | Lý do hủy | Textarea | Có | Bắt buộc nhập lý do | `cancellation_requests.reason` |
| 3 | Tỷ lệ khấu trừ | Display | — | Tự động áp dụng theo thời điểm gửi đơn | `cancellation_requests.deduction_rate` |
| 4 | Tiền hoàn dự kiến | Display | — | `total_price * (1 - deduction_rate)` | `cancellation_requests.refund_amount` |

*Chính sách khấu trừ hoàn tiền (BR10):*
- Hủy trước ngày bắt đầu $\ge$ 03 ngày: Khấu trừ 20% phí chuẩn bị mặt bằng, hoàn lại 80%.
- Hủy trước ngày bắt đầu $<$ 03 ngày: Khấu trừ 50% chi phí cây giống và vật tư, hoàn lại 50%.
- Đã đến hoặc sau ngày bắt đầu (`start_date`): Không hoàn tiền (0%).

*Additional Logic:*
1. Bảng `payment_transactions` chỉ lưu giao dịch tiền tệ, không chứa logic hủy. Mọi thao tác hủy được thực hiện bài bản qua thực thể `cancellation_requests`.
2. Admin duyệt đơn $
ightarrow$ Hệ thống tự động phát sinh bản ghi `payment_transactions` loại `REFUND` với số tiền `refund_amount`.
3. Hợp đồng chuyển sang `TERMINATED`, thửa đất chuyển sang trạng thái `MAINTENANCE` đúng 04 ngày phơi ải rồi mới mở lại `AVAILABLE` (BR23).

---

## 3. Quy trình Canh tác Chuẩn theo Giống cây

### a. Khởi động luồng chăm sóc theo hình thức canh tác (SCR-KH-06)

**Function trigger:** Sau khi xác nhận thanh toán hợp đồng thành công, hệ thống tự động chuyển hướng khách hàng sang màn hình khởi động hình thức canh tác tại URL `/customer/contract/{contractId}/mode`.

**Function description:** Xác nhận hình thức canh tác đã ký kết và kích hoạt luồng vận hành tương ứng:
1. **Self-growing (Tự canh tác):** Khách hàng được cấp quyền xem Quy trình chuẩn (Read-only) của giống cây do CGNN biên soạn để tham khảo; tự lên vườn chăm sóc và tự ghi Farm Diary; có thể đặt mua dịch vụ lẻ hoặc Gói ủy thác 30 ngày khi bận.
2. **Assisted-growing (Ủy thác trọn gói):** Hệ thống áp dụng 100% Quy trình canh tác chuẩn của giống cây do CGNN biên soạn, tự động đọc các bước trong `template_steps` và sinh toàn bộ danh mục `care_tasks` theo ngày gán cho CVLĐ. Khách hàng theo dõi tiến độ công việc và ảnh nghiệm thu trên Dashboard.

*Additional Logic:* Farmely là dịch vụ thương mại quy chuẩn, không cung cấp dịch vụ may đo (customize). Loại bỏ hoàn toàn khâu duyệt plan hay sửa plan theo ý khách. Khách muốn tự làm theo ý mình thì lựa chọn hình thức Self-growing. *BR:* BR05, BR11, BR12.

---

### b. Soạn Quy trình Chuẩn theo Giống cây (SCR-CGNN-04)

**Function trigger:** Chuyên gia Nông nghiệp chọn mục "Quy trình canh tác chuẩn" trên thanh điều hướng chuyên gia để truy cập danh mục tại URL `/expert/processes`.

**Function description:** CGNN thiết lập và quản lý quy trình kỹ thuật chuẩn cho từng giống cây (`varieties`): các giai đoạn sinh trưởng → các bước thực hiện (`template_steps`) → định mức vật tư (`template_materials`) + ngưỡng an toàn vi khí hậu IoT.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-CGNN-04*

**Function Details:*

| # | Field | Type | Required | Table |
|:--|:------|:-----|:---------|:------|
| 1 | Giống cây | Dropdown | Có | `process_templates.variety_id` |
| 2 | Tên quy trình | Text | Có | `process_templates.template_name` |
| 3 | Version | Text | Có | Phiên bản quy trình (VD: v1.0, v2.0) |
| 4 | Tên bước kỹ thuật | Text | Có | `template_steps.step_name` |
| 5 | Day Offset | Number | Có | Ngày thực hiện tính từ ngày gieo trồng |
| 6 | Loại công việc | Dropdown | Có | SEEDING / FERTILIZING / WATERING / PEST_CONTROL / HARVESTING |
| 7 | Hướng dẫn kỹ thuật | Rich Text | Có | Hướng dẫn chi tiết cho công nhân |
| 8 | Định mức vật tư | Sub-table | — | Danh mục phân bón/chế phẩm và số lượng |
| 9 | Ngưỡng vi khí hậu | Form Group | — | Nhiệt độ min/max, Độ ẩm min/max |

*Additional Logic:* Quy trình được CGNN kiểm duyệt và ban hành áp dụng chung cho tất cả các thửa đất trồng giống rau đó trên toàn nông trại.

---

### c. Theo dõi Tiến độ Quy trình Canh tác (SCR-KH-07)

**Function trigger:** Khách hàng từ Dashboard Hợp đồng bấm chọn tab "Tiến độ quy trình canh tác" để truy cập URL `/customer/contract/{contractId}/process`.

**Function description:** Hiển thị toàn bộ lộ trình canh tác của mùa vụ dưới dạng dòng thời gian trực quan (Interactive Timeline): các bước kỹ thuật đã hoàn thành (kèm ảnh minh chứng của công nhân), bước đang thực hiện hôm nay và các bước dự kiến trong tương lai theo quy chuẩn nông học. Chế độ xem là Read-only, giúp khách hàng nắm rõ tiến độ phát triển của cây mà không làm xáo trộn quy chuẩn kỹ thuật.

---

### d. Điều chỉnh Kỹ thuật Mùa vụ Tập trung (SCR-CGNN-07)

**Function trigger:** Khi phát sinh dịch bệnh thực địa hoặc biến động thời tiết bất thường diện rộng, CGNN truy cập màn hình quản lý quy trình tại URL `/expert/processes/{templateId}/adjust`.

**Function description:** Cho phép CGNN bổ sung hoặc điều chỉnh tập trung một bước can thiệp kỹ thuật (như phun chế phẩm sinh học tăng cường, tạm hoãn tưới nước khi mưa bão). Thay đổi này được hệ thống áp dụng đồng bộ cho tất cả các hợp đồng Assisted-growing đang canh tác giống cây đó, đảm bảo an toàn sinh học toàn khu mà không cần can thiệp lẻ tẻ vào từng hợp đồng riêng biệt. *BR:* BR13.

---

## 4. Vận hành & Chăm sóc

### a. Dashboard CVLĐ (SCR-CVLD-01)

**Function trigger:** Chuyên viên lao động sau khi đăng nhập thành công vào hệ thống, tự động được điều hướng về trang Dashboard nhiệm vụ hàng ngày tại URL `/staff/dashboard`.

**Function description:** Task hôm nay gom theo Plot. **Mobile-first**. Card List: tên task, Plot, giờ, badge trạng thái.

---

### b. Chi tiết Task (SCR-CVLD-02)

**Function trigger:** Chuyên viên lao động bấm chọn một nhiệm vụ cụ thể trong danh sách công việc hôm nay để xem chi tiết hướng dẫn tại URL `/staff/tasks/{taskId}`.

**Function description:** Hướng dẫn kỹ thuật (từ Process Template), checklist vật tư cần mang, vị trí Plot. Nút "Bắt đầu làm" → IN_PROGRESS.

---

### c. Thực thi Task (SCR-CVLD-03)

**Function trigger:** Tại màn hình Chi tiết nhiệm vụ, CVLĐ bấm nút "Bắt đầu thực hiện" để mở màn hình ghi nhận tiến độ và vật tư tại URL `/staff/tasks/{taskId}/execute`.

**Function description:** Ghi vật tư thực tế, chụp ảnh bắt buộc, ghi chú hiện trạng.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-CVLD-03*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Vật tư đã dùng | Dynamic Form | — | Thêm dòng: vật tư + số lượng + đơn vị | `material_usages` (1 row/vật tư → **1NF**) |
| 2 | Ảnh minh chứng | Camera/Upload | **Có** | ≥ 1 ảnh, tối đa 5 | URL lưu DB |
| 3 | Ghi chú | Textarea | — | Bất thường | `care_tasks.notes` |

*Validations:*

| ID | Validation Rule |
|:---|:----------------|
| V8.1 | Phải upload ≥ 1 ảnh (nút "Hoàn thành" disabled nếu chưa có) |
| V8.2 | Vật tư quantity ≥ 0 |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M8.1 | Chưa có ảnh | "Vui lòng chụp ít nhất 1 ảnh minh chứng" | Warning |
| M8.2 | Lưu OK | "Đã ghi nhận" | Success |

*Additional Logic:*

1. Mỗi vật tư → 1 record `material_usages`. **Đảm bảo 1NF** – không dùng JSON.
2. `care_tasks.status` → IN_PROGRESS khi bắt đầu.
3. Hoàn thành (SCR-CVLD-04): status COMPLETED, auto tạo `farm_diaries`, notification KH.
4. *BR:* BR15 (≥1 ảnh), BR17 (auto Farm Diary).

---

### d. Xác nhận hoàn thành Task (SCR-CVLD-04)

**Function trigger:** Sau khi hoàn tất ghi nhận vật tư và ảnh chụp hiện trường tại SCR-CVLD-03, CVLĐ bấm "Tiếp tục" để mở màn hình xem lại và ký đóng nhiệm vụ tại URL `/staff/tasks/{taskId}/confirm`.

**Function description:** Review tóm tắt trước khi đóng: tên task, vật tư đã dùng, ảnh. "Xác nhận" → COMPLETED + FarmDiary + notification KH.

---

### e. Tạo Issue Report (SCR-CVLD-05)

**Function trigger:** Khi phát hiện sâu bệnh hoặc sự cố bất thường tại nông trại, CVLĐ bấm nút "Báo cáo sự cố" từ Dashboard hoặc nhiệm vụ để mở form tại URL `/staff/issues/new`.

**Function description:** Sự cố tại vườn: chọn Plot, loại (sâu bệnh/hỏng giàn/thiếu nước/khác), mô tả, ảnh ≥ 1, severity.

*Field Description:*

| # | Field | Type | Required | Table |
|:--|:------|:-----|:---------|:------|
| 1 | Plot | Dropdown | Có | `issue_reports` (liên kết) |
| 2 | Loại sự cố | Dropdown | Có | Sâu bệnh / Hỏng giàn / Thiếu nước / Khác |
| 3 | Mô tả | Textarea | Có | `issue_reports.description` |
| 4 | Ảnh | Camera/Upload | Có | ≥ 1 ảnh |
| 5 | Mức độ | Dropdown | Có | LOW / MEDIUM / HIGH / CRITICAL |

*Additional Logic:* Submit → `issue_reports` (OPEN) → notification CGNN (+ Admin nếu CRITICAL).

---

### f. Phân công Care Task – Admin (SCR-AD-08)

**Function trigger:** Quản trị viên chọn mục "Phân công nhiệm vụ chăm sóc" trên menu quản trị Admin để truy cập màn hình điều phối tại URL `/admin/tasks`.

**Function description:** Data Table task chưa gán. "Phân công" → chọn CVLĐ → update `assigned_worker_id` → notification CVLĐ → ghi `audit_logs`.

---

## 5. Giám sát Vi khí hậu & Cảnh báo

### a. Theo dõi Vi khí hậu Thửa đất (SCR-KH-10)

**Function trigger:** Khách hàng muốn xem tình trạng vi khí hậu của thửa đất mình đang thuê → từ Dashboard cá nhân (SCR-KH-01), chọn thửa đất và click vào tab "Xem thông số vi khí hậu" → Hệ thống hiển thị dữ liệu đo đạc tại URL `/customer/rental/{rentalId}/environment`.

**Function description:** Màn hình hiển thị dữ liệu (chế độ Read-only) do thiết bị cảm biến vi khí hậu đã được trang trại lắp đặt sẵn trên thửa đất đo đạc tự động: 3 đồng hồ Gauge đo nhiệt độ không khí, độ ẩm đất, độ ẩm không khí hiện tại; biểu đồ Line Chart biến thiên 24h/7 ngày; đường so sánh ngưỡng an toàn từ quy trình chuẩn của cây trồng và Widget dự báo thời tiết 5 ngày. Khách hàng không tham gia lắp đặt, điều khiển hay cấu hình thiết bị cảm biến.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-KH-10*

**Function Details:**

| # | Component | Mô tả |
|:--|:----------|:------|
| 1 | 3 Gauge | Nhiệt độ (°C), Độ ẩm đất (%), Độ ẩm không khí (%) – màu Xanh (OK) / Vàng (cận) / Đỏ (vượt ngưỡng) |
| 2 | Timestamp | "Thời gian đo đạc gần nhất: DD/MM/YYYY HH:mm" |
| 3 | Line Chart | Biểu đồ diễn biến nhiệt độ/độ ẩm 24h hoặc 7 ngày qua kèm đường ngưỡng min/max |
| 4 | Weather Widget | Dự báo thời tiết địa phương: nhiệt độ ngoài trời, tốc độ gió, xác suất mưa |
| 5 | Dự báo 5 ngày | Bảng dự báo ngắn hạn 5 ngày tiếp theo |
| 6 | Alert Banner | Banner cảnh báo màu đỏ khi chỉ số môi trường vượt ngưỡng an toàn |

*Additional Logic:*

1. **Nguyên tắc phần cứng:** Cảm biến vi khí hậu được trang trại lắp đặt cố định trên thửa đất (gắn theo `plot_id`), tự động thu thập dữ liệu định kỳ 24/7 độc lập với khách thuê.
2. **Quyền hạn người dùng:** Khách hàng chỉ có quyền xem (Read-only) dữ liệu đo đạc của thửa đất thuộc hợp đồng thuê còn hiệu lực.
3. **Mô phỏng dữ liệu:** Trong phạm vi đồ án, dữ liệu đo đạc được tạo tự động bởi tiến trình nền (Non-Screen Function #1: Cron Job chu kỳ 3 giờ) và lưu vào bảng `sensor_readings`.

---

### b. Giám sát Cảnh báo Vi khí hậu – Admin (SCR-AD-10)

**Function trigger:** Quản trị viên chọn mục "Cảnh báo vi khí hậu IoT" trên thanh điều hướng Admin hoặc bấm vào biểu tượng cảnh báo từ Dashboard Admin để điều hướng đến URL `/admin/alerts`.

**Function description:** Data Table toàn hệ thống: Plot, Loại, Giá trị, Ngưỡng, Thời gian. Filter theo Plot, thời gian, loại.

---

## 6. Nhật ký & Thu hoạch

### a. Farm Diary Timeline (SCR-KH-08)

**Function trigger:** Khách hàng từ Dashboard chọn thửa đất đang hoạt động và bấm vào tab "Nhật ký canh tác" để truy cập dòng thời gian tại URL `/customer/contract/{contractId}/diary`.

**Function description:** Vertical Timeline mới nhất trước. Icon phân biệt KH/CVLĐ. Mỗi entry: ngày, người ghi, nội dung, ảnh chụp hiện trường. Khách hàng Self-growing có thêm nút "+" để tự đăng bài viết nhật ký.

*BR:* BR17 (Task do CVLĐ hoàn thành được hệ thống tự động đồng bộ vào Farm Diary).

---

### b. Tạo nhật ký – Self-growing (SCR-KH-09)

**Function trigger:** Tại màn hình Farm Diary Timeline (SCR-KH-08) của gói tự canh tác (Self-growing), Khách hàng bấm nút hành động nổi "+" (Tạo bài viết mới) để mở form đăng bài tại URL `/customer/contract/{contractId}/diary/new`.

**Function description:** Cho phép khách hàng tự ghi chép trải nghiệm: upload tối đa 5 ảnh, ghi chú tình trạng phát triển của cây, chiều cao cây (cm).

---

### c. Nghiệm thu Nông sản Thu hoạch (SCR-KH-14)

**Function trigger:** Khi CVLĐ hoàn tất cân đo và submit kết quả thu hoạch tại kho, hệ thống gửi thông báo đẩy đến Khách hàng; Khách hàng click thông báo hoặc chọn tab "Thu hoạch" từ chi tiết Hợp đồng để truy cập URL `/customer/contract/{contractId}/harvest`.

**Function description:** Khách hàng kiểm tra sản lượng thực tế (kg), hình ảnh sọt rau kèm màn hình cân điện tử do nhân viên gửi lên. Khách hàng lựa chọn phương thức nhận hàng:
1. **Tự đến nhận tại vườn vào cuối tuần (Farm Pickup):** Hoàn toàn MIỄN PHÍ.
2. **Giao hàng tận nhà (Home Delivery):** Đóng thùng và gửi đối tác giao hàng đến địa chỉ đăng ký; khách hàng thanh toán phí vận chuyển.
Sau khi nhận hàng, khách hàng bấm "Xác nhận nghiệm thu", hợp đồng chuyển sang trạng thái COMPLETED.

---

### d. Ghi nhận Thu hoạch Hiện trường – CVLĐ (SCR-CVLD-07)

**Function trigger:** Chuyên viên lao động được phân công thu hoạch bấm chọn nhiệm vụ thu hoạch trong ngày từ Dashboard để mở màn hình cân đóng gói tại URL `/staff/harvest/{contractId}`.

**Function description:** CVLĐ tiến hành cắt rau, mang về kho cân trên cân điện tử, chụp ảnh hiện trường và nhập số liệu vào hệ thống.

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Nhân viên thực hiện | Display | — | Lưu ID nhân viên trực tiếp cân đo | `harvest_results.staff_id` |
| 2 | Sản lượng thực tế | Number | Có | Trọng lượng cân điện tử (kg, > 0) | `harvest_results.yield_kg` |
| 3 | Ảnh minh chứng cân | Upload | Có | Ảnh chụp sọt rau kèm màn hình cân | `harvest_results.photo_urls` |
| 4 | Tùy chọn giao nhận | Display | — | Nhận tại vườn hoặc Giao tận nhà | `harvest_results.delivery_option` |
| 5 | Ghi chú chất lượng | Textarea | — | Tình trạng lá, độ tươi | `harvest_results.notes` |

*Additional Logic:* Hệ thống lưu vết rõ ràng nhân viên lao động (`staff_id`) chịu trách nhiệm về số liệu cân đo, đảm bảo tính minh bạch tuyệt đối trước khi gửi thông báo nghiệm thu cho khách hàng. *BR:* BR20, BR21.

---

## 7. Trò chuyện & Tư vấn

### a. Chat tư vấn KH ↔ CGNN (SCR-KH-12 / SCR-CGNN-09)

**Function trigger:** Khách hàng bấm nút "Hỏi Chuyên gia" từ chi tiết gói thuê để mở phiên chat tại URL `/customer/consultation/{ticketId}`. Chuyên gia Nông nghiệp nhận thông báo và click để mở phiên tư vấn tương ứng tại URL `/expert/consultations/{ticketId}`.

**Function description:** Chat 2 chiều real-time (text + ảnh). KH tạo ticket (tiêu đề, mô tả, plot, ≤ 3 ảnh). CGNN nhận + phản hồi. Side Panel: giống cây, IoT 3 ngày, Farm Diary gần nhất.

*Additional Logic:*

1. `conversations` + `messages` (sender_id, content, sent_at).
2. WebSocket / polling.
3. Notification tin mới.
4. *BR:* BR25 (KH không chỉ đạo CVLĐ trực tiếp).

---

### b. AI Chatbot (SCR-KH-13)

**Function trigger:** Khách hàng bấm vào biểu tượng bong bóng Trợ lý ảo AI (Floating Chat Widget) cố định ở góc dưới bên phải màn hình trên toàn hệ thống.

**Function description:** Trợ lý ảo AI Chatbot tự động giải đáp thắc mắc 24/7 về các kiến thức kỹ thuật nông nghiệp cơ bản, lịch mùa vụ và kỹ thuật chăm sóc cây trồng dựa trên kho tri thức nông nghiệp. Giao diện luôn hiển thị dòng khuyến cáo: "Thông tin tư vấn từ AI Chatbot chỉ mang tính chất tham khảo. Với các tình huống sâu bệnh bất thường hoặc rủi ro thực tế trên thửa đất, vui lòng tạo phiên trao đổi 1-1 với Chuyên gia Nông nghiệp (SCR-KH-12)."

---

### c. Chat CVLĐ ↔ CGNN (SCR-CVLD-06 / SCR-CGNN-10)

**Function trigger:** Từ chi tiết Báo cáo sự cố thực địa (SCR-CVLD-05), CVLĐ hoặc CGNN bấm nút "Trao đổi kỹ thuật" để mở kênh trao đổi nội bộ tại URL `/staff/issues/{issueId}/chat` (CVLĐ) hoặc `/expert/issues/{issueId}` (CGNN).

**Function description:** Kênh riêng CVLĐ ↔ CGNN về sự cố. CGNN có thể "Đề xuất Plan Revision" → SCR-CGNN-08.

---

## 8. Tri thức Nông nghiệp

### a. Kho tài liệu chuyên môn (SCR-CGNN-06)

**Function trigger:** Chuyên gia Nông nghiệp chọn mục "Kho tài liệu chuyên môn" trên menu điều hướng chuyên gia để truy cập URL `/expert/documents`.

**Function description:** CGNN số hóa, upload và quản lý các tài liệu kỹ thuật canh tác (PDF, Word, ảnh), phân loại theo danh mục sâu bệnh, dinh dưỡng, kỹ thuật trồng làm cơ sở tri thức để AI Chatbot tra cứu trả lời khách hàng.

*Field Description:*

| # | Field | Type | Required | Table |
|:--|:------|:-----|:---------|:------|
| 1 | Tiêu đề | Text | Có | `knowledge_documents.title` |
| 2 | Nội dung | Rich Text | Có | `knowledge_documents.content` |
| 3 | Phân loại | Dropdown | Có | Kỹ thuật trồng / Sâu bệnh / Dinh dưỡng |
| 4 | File đính kèm | File Upload | — | PDF, ảnh |

---

## 9. Quản trị Hệ thống

### a. Quản lý User & RBAC (SCR-AD-02)

**Function trigger:** Quản trị viên chọn mục "Quản lý Người dùng & Phân quyền" trên menu điều hướng Admin để truy cập danh sách tài khoản tại URL `/admin/users`.

**Function description:** CRUD users: tạo CGNN/CVLĐ/Admin, sửa, khóa/mở. KH tự đăng ký qua SCR-PUB-02.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-AD-02*

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Họ và tên | Text | Có | 2–100 ký tự | `users.full_name` |
| 2 | Email | Email | Có | Unique | `users.email` |
| 3 | SĐT | Tel | Có | 10 số, unique | `users.phone` |
| 4 | Mật khẩu | Password | Có (tạo mới) | ≥ 8 ký tự | `users.password_hash` |
| 5 | Vai trò | Dropdown | Có | EXPERT / STAFF / ADMIN | `users.role_id` |
| 6 | Trạng thái | Toggle | — | ACTIVE / INACTIVE | `users.status` |

*Additional Logic:*

1. Admin không tự khóa chính mình.
2. Khóa TK → nhập lý do → ghi `audit_logs`.
3. Mọi CRUD → ghi `audit_logs`.

---

### b. Quản lý Land & Plot (SCR-AD-03, SCR-AD-04)

**Function trigger:** Quản trị viên chọn mục "Quản lý Khu đất (Lands)" tại `/admin/lands` hoặc "Quản lý Thửa đất (Plots)" tại `/admin/plots` từ menu quản trị Admin.

**Function description:** CRUD Land (tên, địa chỉ, GPS, diện tích, thổ nhưỡng, nguồn nước, ảnh). CRUD Plot (mã unique, land, diện tích, giá/kỳ, IoT Code, listing Published/Hidden, ảnh).

---

### c. Quản lý Danh mục Dịch vụ Master (SCR-AD-06)

**Function trigger:** Quản trị viên chọn mục "Danh mục Dịch vụ Master" trên thanh điều hướng Admin để truy cập URL `/admin/services`.

**Function description:** Quản lý toàn bộ danh mục dịch vụ niêm yết của nông trại, phân loại thành 2 nhóm:
1. **Dịch vụ lẻ theo lượt (A-la-carte):** Tưới bù ẩm khẩn cấp, phun chế phẩm sinh học phòng trừ sâu rầy, xới đất bón phân hữu cơ, hỗ trợ thu hoạch. Khi khách mua, hệ thống tự động sinh 01 `care_tasks` phát sinh giao cho CVLĐ trực ca.
2. **Gói ủy thác chăm sóc trọn gói 30 ngày (Temporary Full-care Month Pass):** Dành cho khách hàng tự trồng nhưng bận công tác 1 tháng. Đơn giá = Phí Full Service chuẩn * 1.2. Khi thanh toán, hệ thống tự động quét `template_steps` trong 30 ngày đó để sinh danh mục `care_tasks` cho CVLĐ chăm sóc thay.

*Field Description:*

| # | Field | Type | Required | Constraint | Table |
|:--|:------|:-----|:---------|:-----------|:------|
| 1 | Mã dịch vụ | Text | Có | Unique (VD: SRV_WATER, SRV_MONTH_CARE) | `services.service_code` |
| 2 | Tên dịch vụ | Text | Có | Tên hiển thị trên Marketplace | `services.service_name` |
| 3 | Phân loại | Dropdown | Có | A_LA_CARTE / TEMPORARY_FULL_CARE | `services.service_type` |
| 4 | Đơn vị tính | Text | Có | Lần / Gói 30 ngày / Đợt | `services.unit_name` |
| 5 | Đơn giá niêm yết | Number | Có | Giá tiền VNĐ (> 0) | `services.unit_price` |
| 6 | Trạng thái | Toggle | — | Đang kinh doanh / Tạm dừng | `services.is_active` |

---

### d. Giám sát Rental (SCR-AD-07)

**Function trigger:** Quản trị viên chọn mục "Giám sát Giao dịch & Gói thuê" trên thanh menu quản trị để truy cập URL `/admin/rentals`.

**Function description:** Data Table: Mã Rental, KH, Plot, Ngày, Trạng thái, Hình thức. Filter + chi tiết khi click.

---

### e. Tra cứu Audit Log (SCR-AD-11)

**Function trigger:** Quản trị viên chọn mục "Nhật ký kiểm toán (Audit Log)" trên thanh điều hướng Admin để truy cập URL `/admin/audit-log`.

**Function description:** Tra cứu nhật ký thao tác hệ thống. **Read-only** – không sửa/xóa.

**Screen layout:** *Xem mockup tại `docs/prototype/` – SCR-AD-11*

**Function Details:**

| # | Field | Mô tả | Table |
|:--|:------|:------|:------|
| 1 | Thời gian | Timestamp | `audit_logs.timestamp` |
| 2 | User | Người thực hiện | `users.full_name` |
| 3 | IP | Địa chỉ IP | `audit_logs.ip_address` |
| 4 | Action | CREATE/UPDATE/DELETE/LOGIN/LOGOUT | `audit_logs.action` |
| 5 | Entity | Đối tượng | `audit_logs.entity_type` + `entity_id` |
| 6 | Mô tả | Chi tiết thay đổi | `audit_logs.details` |

*Additional Logic:*

1. Filter: Date Range, User, Action type.
2. Phân trang + tìm kiếm. Export CSV.
3. Ghi bởi Interceptor (Non-Screen Function #5).

---

### f. Dashboard AD (SCR-AD-01)

**Function trigger:** Quản trị viên sau khi đăng nhập thành công vào hệ thống với quyền ROLE_ADMIN, hệ thống tự động chuyển hướng về trang tổng quan quản trị tại URL `/admin/dashboard`.

**Function description:** KPI: tỷ lệ lấp đầy (%), doanh thu tháng, Self vs Assisted (%), task đúng hạn (%). Biểu đồ doanh thu/tháng. Task hôm nay. Cảnh báo IoT active.

---

*Hết tài liệu SRS v1.0 – FARMELY*
