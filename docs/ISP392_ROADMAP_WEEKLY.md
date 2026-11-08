# 🗺️ LỘ TRÌNH ISP392 — PHÂN BỔ THEO TUẦN (Nhóm 4-5 người)
## Dự án: Farmely AgriTech Platform | Hiện tại: Tuần 3-4 (Buổi 5-10)

> **Quy ước:** ✅ = Đã xong | 🔨 = Đang làm | ⬜ = Chưa bắt đầu
> **Tổng:** 60 buổi = 3 Iterations + Final Defense | LOC tích lũy: 180 → 240 → 660 → 720/người

---

## 📊 TIẾN ĐỘ HIỆN TẠI (Tuần 3-4)

| Deliverable | Trạng thái | Ghi chú |
|:---|:---:|:---|
| Chọn đề tài & lập nhóm | ✅ | AgriTech Plot Rental & Monitoring |
| Research Proposal v2.1 | ✅ | 27 Business Rules, 4 Actors |
| User Stories | ✅ | `docs/requirements/user-stories.md` |
| Screen Description | ✅ | `docs/requirements/screen-description.md` |
| ERD Conceptual (15 thực thể) | ✅ | Draw.io + PlantUML |
| ERD Physical (28 bảng) | ✅ | `ERD TU VE 2.0.drawio` — khớp 100% SQL |
| DDL SQL Server (27 bảng) | ✅ | `farmely_27tables_sqlserver.sql` |
| DDL PostgreSQL (28 bảng) | ✅ | `farmely_db_setup_optimized.sql` — chạy OK |
| Database chạy trên PostgreSQL 18 | ✅ | `farmely_agritech` trên localhost:5432 |
| Use Case Diagram | ✅ | PlantUML 5 subsystem |
| Context Diagram | ✅ | PlantUML |
| System Architecture Diagram | ✅ | PlantUML |
| **Setup Git repo** | ⬜ | **Chưa có commit nào!** |
| **Setup project code (Spring Boot)** | ⬜ | Chưa init |
| **RDS Document (Word)** | ⬜ | Chưa tổng hợp thành file nộp |
| **Seed Data** | 🔨 | Có file nhưng chưa phong phú |

---

## 🔴 ITERATION 1 — Buổi 1-18 (Tuần 1-6) | Trọng số: 15% | ≥ 180 LOC/người

### Tuần 1-2 (Buổi 1-4) — ✅ ĐÃ XONG
- ✅ Lập nhóm, bầu Team Lead
- ✅ Chọn đề tài, viết Research Proposal
- ✅ Phác thảo Actor & Use Case sơ bộ

### Tuần 3-4 (Buổi 5-10) — 🔨 ĐANG LÀM ← **BẠN Ở ĐÂY**

#### Tuần 3 (Buổi 5-7): Chốt thiết kế & Setup dự án
| Việc | Ai làm | Output | Deadline |
|:---|:---|:---|:---|
| ⬜ Init Spring Boot project trên GitHub | Team Lead | Repo có README, .gitignore, pom.xml | Buổi 5 |
| ⬜ Setup Git flow: branch `main` + `develop` + nhánh feature | Team Lead | Branch strategy doc | Buổi 5 |
| ⬜ Mỗi người clone repo, test build thành công | Cả nhóm | Screenshot build OK | Buổi 5 |
| ⬜ Chốt ERD 28 bảng (dùng `ERD TU VE 2.0.drawio`) | Team Lead | File .drawio final | Buổi 6 |
| ⬜ Chạy DDL lên SQL Server (SSMS lab trường) | 1 người | Database `farmely` trên SSMS | Buổi 6 |
| ⬜ Tạo Seed Data thực tế (≥10 records/bảng core) | 2 người | `seed_data.sql` | Buổi 7 |
| ⬜ Viết RDS Document (phần Use Case Spec) | 1-2 người | File Word/PDF | Buổi 7 |

#### Tuần 4 (Buổi 8-10): Phân màn hình & Bắt đầu code
| Việc | Ai làm | Output | Deadline |
|:---|:---|:---|:---|
| ⬜ Phân công màn hình theo **Vertical Slice** | Team Lead | Bảng phân công WBS | Buổi 8 |
| ⬜ Setup JPA/Hibernate Entity cho 28 bảng | 1 người | `src/main/java/.../entity/*.java` | Buổi 8-9 |
| ⬜ Setup Spring Security + Login/Register | 1 người | Auth flow hoạt động | Buổi 9-10 |
| ⬜ Trang chủ Marketplace (list plots) | 1 người | JSP/Thymeleaf + Controller + DAO | Buổi 9-10 |
| ⬜ CRUD Quản lý Land/Plot (Admin) | 1 người | Admin panel cơ bản | Buổi 9-10 |
| ⬜ Hoàn thiện RDS Document | 1 người | Nộp Buổi 10 | Buổi 10 |

### Tuần 5-6 (Buổi 11-18) — ⬜ CHƯA BẮT ĐẦU

#### Tuần 5 (Buổi 11-14): Code Foundation + CRUD
| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ CRUD Quản lý Crops/Varieties (Admin/Expert) | Người 1 | Controller + DAO + View |
| ⬜ CRUD Quản lý Materials (Admin) | Người 2 | Controller + DAO + View |
| ⬜ Trang Chi tiết Plot + bộ lọc tìm kiếm | Người 3 | Search/Filter UI |
| ⬜ Trang Profile người dùng + đổi mật khẩu | Người 4 | User profile page |
| ⬜ Tích hợp UI template (Bootstrap/AdminLTE) | Người 5 | Layout chung Header/Sidebar/Footer |

#### Tuần 6 (Buổi 15-18): Hoàn thiện + Review Iteration 1
| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ Fix bug, test lại tất cả màn hình | Cả nhóm | Chạy trơn tru |
| ⬜ Đếm LOC từng người (≥ 180 LOC) | Team Lead | Bảng LOC |
| ⬜ Chuẩn bị demo Iteration 1 | Cả nhóm | Kịch bản demo |
| ⬜ **Buổi 17-18: CHẤM ON-GOING 1 (15%)** | Hội đồng | Nộp: Source + DB + RDS |

**CQ cần chuẩn bị:** CQ1.1 (Actors), CQ2.2 (Screen map), CQ3.2 (Tables & FK), CQ3.3 (Git commands), CQ4.2 (Screen↔Table mapping), CQ6.2 (Business rules)

---

## 🟡 ITERATION 2 — Buổi 19-36 (Tuần 7-12) | Trọng số: 20% | ≥ 240 LOC/người

### Tuần 7-8 (Buổi 19-24): Nhận phản hồi + Code nghiệp vụ lõi

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ Demo Iteration 1 cho GV, nhận feedback | Cả nhóm | Danh sách sửa đổi |
| ⬜ Sửa RDS/SDS theo feedback GV | 1 người | RDS v2 |
| ⬜ **Luồng Đặt hàng:** Chọn Plot → Chọn Variety → Chọn ngày → Tạo Order | Người 1 | Order flow end-to-end |
| ⬜ **Luồng Thanh toán:** Order → Payment (mock VNPay) → Confirm Rental | Người 2 | Payment integration |
| ⬜ **Dashboard Admin:** Thống kê orders/rentals/revenue | Người 3 | Admin dashboard |
| ⬜ **Quản lý Process Templates:** Expert tạo quy trình canh tác | Người 4 | Template CRUD + Steps |

### Tuần 9-10 (Buổi 25-30): Nghiệp vụ nâng cao

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ **Giỏ hàng 15 phút:** Timer giữ chỗ + auto-cancel hết hạn | Người 1 | Reservation logic |
| ⬜ **Cultivation Plans:** Tạo kế hoạch canh tác từ template | Người 2 | Plan generation |
| ⬜ **Care Tasks:** Phân công task cho Staff, checklist hàng ngày | Người 3 | Task management |
| ⬜ **Tìm kiếm/Lọc nâng cao:** Multi-criteria filter plots | Người 4 | Advanced search |
| ⬜ **Service Requests:** KH yêu cầu dịch vụ bổ sung | Người 5 | Service flow |

### Tuần 11-12 (Buổi 31-36): Tích hợp + Review Iteration 2

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ Tích hợp tất cả nhánh vào `develop` | Cả nhóm | Merge clean |
| ⬜ Test end-to-end luồng chính | Cả nhóm | Test report |
| ⬜ Đếm LOC (≥ 240 LOC tăng thêm) | Team Lead | Bảng LOC |
| ⬜ Cập nhật SDS (Sequence Diagram cho luồng lõi) | 1 người | SDS document |
| ⬜ **Buổi 35-36: CHẤM ON-GOING 2 (20%)** | Hội đồng | Nộp: Source + DB + RDS + SDS |

**CQ cần chuẩn bị:** CQ7.2 (Code modules), CQ9.2 (Business logic rules), CQ11.3 (Integration & Exception handling)

---

## 🟢 ITERATION 3 — Buổi 37-54 (Tuần 13-18) | Trọng số: 25% | ≥ 660 LOC tích lũy

### Tuần 13-14 (Buổi 37-42): Tính năng nâng cao

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ Demo Iteration 2, nhận feedback | Cả nhóm | Danh sách cải tiến |
| ⬜ **RBAC hoàn chỉnh:** 4 role (Admin, Expert, Staff, Customer) + Filter chặn URL | 1 người | Security complete |
| ⬜ **Farm Diary:** KH/Staff ghi nhật ký canh tác + ảnh | 1 người | Diary CRUD + image upload |
| ⬜ **Sensor Readings:** Mock IoT data mỗi 3h + Dashboard biểu đồ | 1 người | Chart.js/ApexCharts |
| ⬜ **Chat/Conversations:** KH ↔ Expert, Staff ↔ Expert | 1 người | Real-time hoặc polling |
| ⬜ **Notifications:** Thông báo đẩy (task due, payment, status change) | 1 người | Notification system |

### Tuần 15-16 (Buổi 43-48): Tích hợp toàn hệ thống

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ **Harvest Results:** Ghi nhận thu hoạch, kết thúc rental | 1 người | Harvest flow |
| ⬜ **Issue Reports:** Báo cáo sự cố + ảnh minh chứng | 1 người | Issue tracking |
| ⬜ **Audit Logs:** Ghi lại mọi hành động CREATE/UPDATE/DELETE | 1 người | Audit trail |
| ⬜ **Material Usages:** Ghi nhận vật tư sử dụng thực tế vs kế hoạch | 1 người | Material tracking |
| ⬜ **Knowledge Documents:** Expert upload tài liệu hướng dẫn | 1 người | Document library |
| ⬜ Validation 2 lớp (Client JS + Server Java) cho TẤT CẢ form | Cả nhóm | No raw 500 errors |

### Tuần 17-18 (Buổi 49-54): Đánh bóng + Review Iteration 3

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ Fix toàn bộ bug tồn đọng | Cả nhóm | Bug-free |
| ⬜ Trang lỗi tùy biến (404, 500, 403) | 1 người | Custom error pages |
| ⬜ Responsive mobile (nếu kịp) | 1 người | Mobile-friendly |
| ⬜ Đếm LOC (≥ 660 tích lũy) | Team Lead | Bảng LOC |
| ⬜ Cập nhật RDS/SDS đầy đủ | 1 người | Tài liệu hoàn chỉnh |
| ⬜ **Buổi 53-54: CHẤM ON-GOING 3 (25%)** | Hội đồng | Full system demo |

**CQ cần chuẩn bị:** CQ13.2 (Security — SQL Injection, XSS, BCrypt), CQ15.2 (Architecture — Controller→Service→DAO→DB), CQ15.3 (Integration & conflict resolution)

---

## 🔵 FINAL DEFENSE — Buổi 55-60 (Tuần 19-20) | Trọng số: 40% | ≥ 720 LOC tích lũy

### Tuần 19 (Buổi 55-58): Freeze code + Chuẩn bị

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ **CODE FREEZE** — Không thêm feature mới | Cả nhóm | Branch `release` |
| ⬜ Nạp Seed Data thực tế đẹp (ảnh, tên, giá hợp lý) | 2 người | `database_init_with_data.sql` |
| ⬜ Test toàn bộ luồng end-to-end với data thật | Cả nhóm | Demo script |
| ⬜ Chuẩn bị Slide thuyết trình (15-20 slide) | 1 người | PowerPoint/Google Slides |
| ⬜ Viết kịch bản demo (user flow từ đầu đến cuối) | Team Lead | Demo screenplay |
| ⬜ Đếm LOC cuối cùng (≥ 720) | Team Lead | Final LOC report |

### Tuần 20 (Buổi 59-60): Diễn tập + Bảo vệ

| Việc | Ai làm | Output |
|:---|:---|:---|
| ⬜ **Mock Defense:** Nhóm đóng vai GV hỏi xoáy lẫn nhau | Cả nhóm | Mỗi người trả lời mượt |
| ⬜ Mỗi người tập giải thích code CỦA MÌNH (DAO, Controller, Service) | Cả nhóm | Ai cũng tự tin |
| ⬜ Backup DB + Source code lên USB/Drive phòng sự cố | Team Lead | Backup sẵn sàng |
| ⬜ **BẢO VỆ FINAL PRESENTATION (40%)** | Hội đồng 2 GV | 15-20' demo + 25' Q&A |

---

## 📋 CHECKLIST PHÂN CÔNG VERTICAL SLICE (Gợi ý cho 5 người)

| Thành viên | Màn hình phụ trách | Bảng DB sở hữu | Iter |
|:---|:---|:---|:---:|
| **Người 1 (Team Lead)** | Marketplace (list/search/filter plots), Chi tiết Plot | plots, lands, plot_crop_compatibility, sensor_readings | 1-2 |
| **Người 2** | Đặt hàng (Order flow), Thanh toán, Lịch sử đơn | orders, rentals, payment_transactions, service_requests | 2 |
| **Người 3** | Quản lý canh tác (Plans, Tasks, Material usage) | cultivation_plans, plan_versions, care_tasks, material_usages | 2-3 |
| **Người 4** | Farm Diary, Harvest, Issue Reports, Sensor Dashboard | farm_diaries, harvest_results, issue_reports, knowledge_documents | 3 |
| **Người 5** | Auth/Profile, Chat, Notifications, Admin CRUD master data | users, roles, crops, varieties, materials, conversations, messages, notifications, audit_logs | 1-3 |

> ⚠️ **Mỗi người PHẢI viết đủ cả 3 tầng:** View (JSP/Thymeleaf) + Controller + Service + DAO/Repository cho các bảng của mình. Tuyệt đối không để 1 người code DAO cho cả nhóm!

---

## ⏰ VIỆC CẦN LÀM NGAY (Tuần này — Buổi 5-7)

### 🚨 Ưu tiên #1: INIT GIT REPO NGAY!
```bash
# Team Lead chạy lệnh này:
git init
git add .
git commit -m "Initial commit: docs, ERD, SQL scripts"
git remote add origin <URL-GitHub-repo>
git push -u origin main
```
Lý do: **GV sẽ kiểm tra commit history**. Nếu commit đầu tiên là ngày sát deadline = nghi ngờ gian lận.

### 🚨 Ưu tiên #2: Init Spring Boot Project
- Spring Initializr: Java 17, Spring Boot 3.x, dependencies: Web, JPA, Security, Thymeleaf, SQL Server Driver
- Cấu trúc package: `com.farmely.model`, `com.farmely.repository`, `com.farmely.service`, `com.farmely.controller`

### 🚨 Ưu tiên #3: Phân công Vertical Slice
- Họp nhóm 30 phút, mỗi người chọn 2-3 màn hình, ký tên commit
- Tạo GitHub Issues cho từng màn hình

---

## 📈 BẢNG THEO DÕI LOC

| Iteration | Mục tiêu/người | Cách đếm |
|:---|:---:|:---|
| **Iter 1** (Buổi 18) | ≥ 180 | Chỉ đếm code trong Controller, Service, DAO, Validation, Model |
| **Iter 2** (Buổi 36) | ≥ 240 thêm | Transaction logic, giỏ hàng, filter nâng cao |
| **Iter 3** (Buổi 54) | ≥ 660 tích lũy | RBAC, notifications, chat, audit |
| **Final** (Buổi 60) | ≥ 720 tích lũy | Polish + fix + optimize |

> **Mẹo:** Đếm bằng `git log --author="Tên" --numstat` hoặc dùng tool `cloc` loại trừ thư mục generated.

---
*Tạo bởi Hermes Agent — Cập nhật: 29/09/2026*
