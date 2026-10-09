# 🌱 AGRITECH PLATFORM – NỀN TẢNG THUÊ PLOT & THEO DÕI TRẢI NGHIỆM CANH TÁC
> **Đồ án môn học:** ISP392 – Information System Programming Project  
> **Trường Đại học:** FPT University  
> **Mô hình triển khai:** Web Enterprise Application (MVC Architecture)  
> **Kiến trúc tham chiếu:** High Scalability & Clean Architecture (Donne Martin System Design Primer)

---

## 📑 MỤC LỤC
1. [Giới Thiệu Dự Án](#1-giới-thiệu-dự-án)
2. [Cấu Trúc Thư Mục Dự Án](#2-cấu-trúc-thư-mục-dự-án)
3. [Mục Lục Tài Liệu Kỹ Thuật (Documentation Index)](#3-mục-lục-tài-liệu-kỹ-thuật-documentation-index)
4. [Tác Nhân & Luồng Nghiệp Vụ Cốt Lõi](#4-tác-nhân--luồng-nghiệp-vụ-cốt-lõi)
5. [Kiến Trúc Kỹ Thuật & Công Nghệ](#5-kiến-trúc-kỹ-thuật--công-nghệ)
6. [Lộ Trình Iterations & Định Mức LOC](#6-lộ-trình-iterations--định-mức-loc)
7. [Hướng Dẫn Công Cụ & Thao Tác](#7-hướng-dẫn-công-cụ--thao-tác)

---

## 1. GIỚI THIỆU DỰ ÁN

Dự án phát triển nền tảng kết nối người dân đô thị với nông trại tập trung, cho phép khách hàng thuê từng mảnh đất nhỏ (**Plot**) để tự tay canh tác rau sạch (**Self-growing**) hoặc ủy thác chăm sóc trọn gói (**Assisted-growing**). 

Hệ thống số hóa chu trình khép kín:
$$\text{Marketplace} \rightarrow \text{Consultation (Optional)} \rightarrow \text{Reservation (15m)} \rightarrow \text{Payment (100\% Upfront)} \rightarrow \text{Cultivation} \rightarrow \text{Monitoring & Diary} \rightarrow \text{Harvest}$$

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

Toàn bộ dự án được tổ chức theo tiêu chuẩn kỹ nghệ phần mềm chuyên nghiệp:

```text
isp392/
├── .gitignore                          # Cấu hình loại trừ file rác, build artifacts, binaries
├── README.md                           # Trang chủ dự án & bản đồ điều hướng tài liệu
│
├── docs/                               # Toàn bộ tài liệu phân tích, đặc tả và thiết kế
│   ├── requirements/                   # Hồ sơ yêu cầu nghiệp vụ
│   │   ├── research-proposal.md        # Đề xuất nghiên cứu & yêu cầu nghiệp vụ chi tiết v2.1
│   │   ├── user-stories.md             # Đặc tả 9 Epics, User Stories & Acceptance Criteria
│   │   └── screen-description.md       # Đặc tả 47 màn hình UI/UX chi tiết
│   │
│   ├── architecture/                   # Hồ sơ thiết kế kiến trúc hệ thống
│   │   ├── system-design-spec.md       # Thiết kế kiến trúc (Capacity, Caching, Locks, CAP)
│   │   ├── use-case-spec.md            # Đặc tả 5 hệ thống Use Case (Clean Architecture)
│   │   └── use-case-analysis-report.md # Báo cáo đánh giá chất lượng thiết kế Use Case
│   │
│   ├── database/                       # Thiết kế CSDL (ERD, DDL scripts, Dummy data)
│   │   ├── entity-spec.md              # Đặc tả 35 thực thể dữ liệu (5 cụm, truy vết BR01-BR27)
│   │   ├── schema_sqlserver.sql        # DDL Microsoft SQL Server (35 bảng + khóa ngoại + index)
│   │   ├── seed_data_sqlserver.sql     # Dữ liệu mẫu khởi tạo cho SQL Server
│   │   ├── schema_postgresql.sql       # DDL PostgreSQL 15+ (35 bảng + khóa ngoại + index)
│   │   └── seed_data_postgresql.sql    # Dữ liệu mẫu khởi tạo cho PostgreSQL
│   │
│   ├── academic/                       # Tài liệu môn học & quy chế khảo thí
│   │   └── syllabus-isp392.md          # Cẩm nang môn học ISP392, tiêu chí LOC & 33 câu hỏi vấn đáp
│   │
│   └── diagrams/                       # Mã nguồn PlantUML (.puml) và ảnh kết xuất (.png)
│       ├── 01_System_Overview.puml / .png
│       ├── 02_Customer_Subsystem.puml / .png
│       ├── 03_Agri_Expert_Subsystem.puml / .png
│       ├── 04_Field_Staff_Subsystem.puml / .png
│       ├── 05_Admin_Subsystem.puml / .png
│       ├── 00_Context_Diagram.puml / .png  # Sơ đồ Ngữ cảnh DFD Mức 0
│       ├── 01_System_Overview.puml / .png
│       ├── 02_Customer_Subsystem.puml / .png
│       ├── 03_Agri_Expert_Subsystem.puml / .png
│       ├── 04_Field_Staff_Subsystem.puml / .png
│       ├── 05_Admin_Subsystem.puml / .png
│       ├── 06_System_Architecture_Primer.puml / .png
│       ├── context-diagram.html            # Bản vẽ DFD Mức 0 tương tác web
│       ├── 07_ERD_Conceptual.puml / .png   # ERD master logic (35 entities)
│       ├── erd/                             # Bộ ERD phân tầng để báo cáo & bảo vệ
│       │   ├── 00_ERD_Conceptual.puml/.png # Conceptual ERD: 13 thực thể lõi
│       │   ├── 01_ERD_RBAC.puml/.png
│       │   ├── 02_ERD_Agronomy_KB.puml/.png
│       │   ├── 03_ERD_Rentals_Commerce.puml/.png
│       │   ├── 04_ERD_Operations_Tasks.puml/.png
│       │   └── 05_ERD_Monitoring_Support_Harvest.puml/.png
│       └── use-case-diagram.puml
│
├── src/                                # Mã nguồn ứng dụng (Source code)
│   ├── backend/                        # Tầng xử lý nghiệp vụ (Java / Spring / Servlet hoặc .NET)
│   └── frontend/                       # Tầng giao diện người dùng (JSP/HTML/CSS/JS)
│
├── tools/                              # Công cụ hỗ trợ phát triển nội bộ
│   └── plantuml.jar                    # Tool biên dịch sơ đồ PlantUML (ignored in git)
│
└── references/                         # Tài liệu tham khảo kỹ thuật
    └── system-design-primer/           # Kho tri thức System Design Primer (Donne Martin)
```

---

## 3. MỤC LỤC TÀI LIỆU KỸ THUẬT (DOCUMENTATION INDEX)

| Nhóm Tài Liệu | Tệp Tin | Mô Tả Tóm Tắt |
| :--- | :--- | :--- |
| **Yêu cầu Nghiệp vụ** | [`docs/requirements/research-proposal.md`](docs/requirements/research-proposal.md) | Bối cảnh, mục tiêu, 4 Actor, 27 Business Rules (BR01–BR27), quy trình nghiệp vụ tổng quát. |
| | [`docs/requirements/user-stories.md`](docs/requirements/user-stories.md) | 9 Epics, User Stories, Acceptance Criteria chi tiết, Ma trận phân quyền RBAC. |
| | [`docs/requirements/screen-description.md`](docs/requirements/screen-description.md) | Đặc tả 47 màn hình (4 Public, 17 KH, 11 AD, 11 CGNN, 8 CVLĐ), input/output, sự kiện. |
| **Kiến trúc & Sơ đồ** | [`docs/architecture/context-diagram-spec.md`](docs/architecture/context-diagram-spec.md) | Đặc tả Sơ đồ Ngữ cảnh (DFD Mức 0), 8 Tác nhân ngoài, 26 luồng dữ liệu & câu hỏi vấn đáp. |
| | [`docs/architecture/system-design-spec.md`](docs/architecture/system-design-spec.md) | Thiết kế tải, Stateless Backend, Distributed Lock Redis, Queue RabbitMQ, AI RAG. |
| | [`docs/architecture/use-case-spec.md`](docs/architecture/use-case-spec.md) | Sơ đồ Use Case Clean Architecture chuẩn OMG UML 2.5 cho 5 phân hệ. |
| | [`docs/architecture/use-case-analysis-report.md`](docs/architecture/use-case-analysis-report.md) | Báo cáo đánh giá chất lượng thiết kế Use Case đạt 36/40 điểm (90% - Xuất sắc). |
| | [`docs/diagrams/`](docs/diagrams/) | Toàn bộ file PlantUML và ảnh PNG render trực quan. |
| **Thiết kế CSDL** | [`docs/database/entity-spec.md`](docs/database/entity-spec.md) | Đặc tả 35 thực thể (5 cụm nghiệp vụ), 39 quan hệ & bản số, truy vết BR01–BR27, phân hạng theo Iteration. IoT Mock-only theo RP §10.3. |
| | [`docs/database/schema_sqlserver.sql`](docs/database/schema_sqlserver.sql) & [`seed_data_sqlserver.sql`](docs/database/seed_data_sqlserver.sql) | DDL 35 bảng chuẩn 3NF và dữ liệu mẫu nạp thử trên Microsoft SQL Server. |
| | [`docs/database/schema_postgresql.sql`](docs/database/schema_postgresql.sql) & [`seed_data_postgresql.sql`](docs/database/seed_data_postgresql.sql) | DDL 35 bảng chuẩn 3NF và dữ liệu mẫu nạp thử trên PostgreSQL 15+. |
| | [`docs/diagrams/07_ERD_Conceptual.puml`](docs/diagrams/07_ERD_Conceptual.puml) | ERD master logic: 35 thực thể, 39 quan hệ — dùng làm hồ sơ tham chiếu, không dùng cho slide. |
| | [`docs/diagrams/erd/`](docs/diagrams/erd/) | Bộ ERD phân tầng: 1 Conceptual ERD (13 thực thể lõi) + 5 Sub-ERD theo phân hệ; dùng cho slide, SRS và vấn đáp. |
| **Học thuật & Đánh giá**| [`docs/academic/syllabus-isp392.md`](docs/academic/syllabus-isp392.md) | Chuẩn đầu ra CLO1-5, bảng trọng số đánh giá, tiêu chuẩn LOC, 33 câu hỏi vấn đáp. |

---

## 4. TÁC NHÂN & LUỒNG NGHIỆP VỤ CỐT LỖI

### 4.1. Bốn Tác Nhân Con Người (Human Actors)
1. **Khách hàng (KH):** Tìm kiếm Plot, giữ chỗ 15 phút, thanh toán 100% trả trước, theo dõi chỉ số vi khí hậu IoT, tương tác AI Chatbot 24/7, xác nhận thu hoạch.
2. **Chuyên gia nông nghiệp (CGNN):** Quản lý tiêu chuẩn giống cây, ma trận tương thích thổ nhưỡng, biên soạn Standard Process Template, cấu hình ngưỡng an toàn IoT, thẩm định tài liệu RAG, tư vấn kỹ thuật.
3. **Chuyên viên lao động (CVLĐ):** Nhận Care Task hằng ngày qua di động, thực hiện công việc, **bắt buộc chụp ảnh hiện trường ($\ge 1$ ảnh)** nghiệm thu, khai báo vật tư tiêu hao, báo cáo sự cố (Issue Report).
4. **Quản trị viên (AD):** Quản trị người dùng (RBAC), quản lý Land/Plot, phân công Care Task, quản lý danh mục dịch vụ phát sinh, đối soát giao dịch và giám sát System Audit Log.

### 4.2. Hai Hình Thức Canh Tác
* **`Self-growing` (Tự canh tác):** Khách hàng tự trải nghiệm chăm sóc dựa trên Quy trình chuẩn (Read-only); tự ghi Farm Diary; khi IoT cảnh báo bất thường có nút đặt nhanh dịch vụ cứu hộ khẩn cấp (*Quick Service Request*).
* **`Assisted-growing` (Ủy thác trọn gói):** Kế hoạch canh tác (Cultivation Plan) do CGNN lập $\rightarrow$ Khách duyệt trong 48h (Auto-Approve nếu quá hạn trước Start Date) $\rightarrow$ Sinh Care Task cho CVLĐ $\rightarrow$ Nghiệm thu kèm ảnh tự động đẩy vào Farm Diary của khách.

---

## 5. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ

* **Mô hình:** Stateless Multi-Tier Architecture / Enterprise MVC Pattern.
* **Backend:** Java (Servlet/JSP hoặc Spring Boot) / C# (.NET Core).
* **Database:** RDBMS (PostgreSQL / Microsoft SQL Server / MySQL).
* **Caching & Concurrency:** Redis (Distributed Lock `SET NX EX` chống double booking giữ chỗ 15 phút).
* **Asynchronous Queue:** RabbitMQ (Xử lý thông điệp trễ TTL 15 phút mở lại đất khi hết hạn giữ chỗ).
* **AI Service:** AI Chatbot Widget (LLM + RAG) trả lời thường thức làm vườn dựa trên kho tài liệu đã được CGNN thẩm định.

---

## 6. LỘ TRÌNH ITERATIONS & ĐỊNH MỨC LOC

Theo quy định đánh giá môn học ISP392:

| Chặng Đánh Giá | Trọng Số | Thời Lượng | Tiêu Chuẩn LOC / Thành Viên | Nội Dung Đánh Giá Chính |
| :--- | :---: | :---: | :---: | :--- |
| **Iteration 1 (Buổi 20)** | **15%** | 45 phút | **$\ge$ 180 LOC** (rated) | Source Code & Demo DB (10%), Tài liệu RDS (20%), Sản phẩm chạy được (70%). |
| **Iteration 2 (Buổi 40)** | **20%** | 45 phút | **$\ge$ 240 LOC** (rated) | Source Code & Demo DB (10%), Tài liệu RDS (20%), Sản phẩm chạy được (70%). |
| **Iteration 3 (Buổi 56)** | **25%** | 45 phút | **$\ge$ 660 LOC** (tích lũy) | Source Code & Demo DB (15%), Tài liệu RDS (25%), Sản phẩm chạy được (60%). |
| **Final Presentation** | **40%** | 45 phút | **$\ge$ 720 LOC** (toàn dự án) | Demo sản phẩm (40%), Phân tích yêu cầu (20%), Thiết kế phần mềm (20%), Vấn đáp Q&A (20%). |

---

## 7. HƯỚNG DẪN CÔNG CỤ & THAO TÁC

### 7.1. Biên dịch Sơ đồ PlantUML sang Ảnh PNG
Để kết xuất toàn bộ sơ đồ `.puml` trong thư mục `docs/diagrams/` thành `.png`:

```bash
# Sử dụng công cụ plantuml.jar trong thư mục tools/
java -jar tools/plantuml.jar docs/diagrams/*.puml
```

### 7.2. Quy ước Git & Làm việc Nhóm
* **Branch chính (`main`):** Mã nguồn ổn định, đã qua kiểm thử, sẵn sàng demo cho giảng viên tại các buổi Iteration.
* **Branch tính năng (`feature/<actor>-<feature-name>`):**
  * Ví dụ: `feature/kh-marketplace`, `feature/cgnn-standard-template`, `feature/staff-task-execution`.
* **Quy tắc Commit Message:**
  * `feat: Thêm chức năng đặt giữ chỗ 15 phút (US3.3)`
  * `fix: Sửa lỗi xung đột khóa Redis khi đặt trùng Plot`
  * `docs: Cập nhật tài liệu đặc tả màn hình SCR-KH-05`
* **Nguyên tắc phân chia LOC:** Mỗi thành viên phụ trách trọn vẹn từng luồng (Vertical Slice: Controller $\rightarrow$ Service $\rightarrow$ DAO $\rightarrow$ UI JSP/HTML) để đảm bảo đủ số dòng Rated LOC theo quy chế môn học.
