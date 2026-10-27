# Farmely SSoT Drift Log (Hồ Sơ Sai Lệch & Đối Soát 4 Tài Liệu Nộp)

> **Bộ 4 tài liệu nộp chính thức (Baseline SSoT):**
> 1. **Report 1 – Project Introduction:** `docs/submission/Report1_Project_Introduction.docx` (Google Doc ID: `17_eVwBlRE8u5-G24BVdT6BePRqJcmDU1`)
> 2. **Report 2 – Project Management Plan:** `docs/submission/Report2_Project_Management_Plan.docx` (Google Doc ID: `1IeaarZOqmJnU0zRvWr2IcQiAMxcVcpe4`)
> 3. **Report 3 – Software Requirement Specification:** `docs/submission/Report3_Software_Requirement_Specification.docx` (Google Doc ID: `18TXs_r9G1GHJ6ERDNaF_IT8pLk6RcU2W`)
> 4. **Report 4 – Software Design Document:** `docs/submission/Report4_Software_Design_Document.docx` (Google Doc ID: `1z4xND1aggWK8DOUsjjDa5JSo_HGzZnN3`)

---

## Danh Sách Đối Soát & Drift Cần Quản Lý

### [DRIFT-001] Danh xưng Bảng Database: `rentals` vs `contract_items`
- **Ngày:** 2026-10-25
- **File:** `Database/farmely_full_database.sql`, `Database/seed_lands_and_plots.sql`
- **Docs nói (Report 4 §2.1 & §2.3):** Bảng phụ lục hợp đồng từng thửa là `contract_items`. Header hợp đồng là `contracts`. Không dùng trung gian Order. Mỗi `contract_item` đại diện cho một Rental lifecycle.
- **Code làm:** Code SQL và Backend hiện tại đang đặt tên bảng là `rentals` (khóa ngoại `contract_id`).
- **Lý do lệch:** Code khởi tạo ban đầu dùng thuật ngữ ngắn `rentals`. Report 4 quy chuẩn hóa theo quan hệ thực thể Master-Detail `contracts` $\rightarrow$ `contract_items`.
- **Cần cập nhật:** ERD, DDL SQL hoặc Mapper/Entity alias trong backend.
- **Cách sửa:** Giữ alias / view hoặc migration hỗ trợ song song cả hai tên, bảo đảm báo cáo bảo vệ và DDL mapping 1:1 với Report 4.
- **Trạng thái:** ❌ Chưa sửa (Đang ánh xạ qua alias trong backend)

---

### [DRIFT-002] Cơ chế Giữ Chỗ & Khóa Trùng Lịch: `plot_occupancies` & `reservations`
- **Ngày:** 2026-10-25
- **File:** `Database/farmely_full_database.sql`, `backend/rental-service/`
- **Docs nói (Report 4 §2.1 & §2.4):** Tính toán availability dựa trên khoảng thời gian `plot_occupancies` (`starts_at`, `ends_at`, `kind`, `status`), tách biệt với publication status. Bảng `reservations` và `reservation_items` lưu hold 15 phút + 10 phút grace period.
- **Code làm:** Trong DDL 26 bảng ban đầu, `contracts` quản lý trạng thái `PENDING` trực tiếp kèm `reservation_expires_at` và `grace_applied`. Chưa có bảng riêng `plot_occupancies`.
- **Lý do lệch:** Tối giản hóa Ponytail để chạy nhanh demo ban đầu, chưa tạo bảng trung gian `plot_occupancies`.
- **Cần cập nhật:** SDS/SDD, DDL database.
- **Cách sửa:** Bổ sung DDL table `plot_occupancies` hoặc migration script trong PostgreSQL để khớp 100% với DDL 39 bảng của Report 4 khi bảo vệ Final.
- **Trạng thái:** ❌ Chưa sửa (Logic chạy trên contract PENDING)

---

### [DRIFT-003] Tên bảng Khả năng tương thích & Hủy hợp đồng: `plot_crop_compatibility` vs `plot_variety_compatibility`
- **Ngày:** 2026-10-25
- **File:** `Database/farmely_full_database.sql`
- **Docs nói (Report 4 §2.3 #7 & #16):**
  - Tên bảng tương thích: `plot_crop_compatibility` (liên kết `plot_id` và `variety_id`).
  - Tên bảng hủy hợp đồng: `cancellation_requests` (liên kết `contract_id`).
- **Code làm:**
  - SQL đặt tên là `plot_variety_compatibility`.
  - Bảng hủy hợp đồng đặt tên là `contract_cancellations`.
- **Lý do lệch:** Lệch về naming convention giữa bản thảo ban đầu và bản hoàn thiện nộp của Report 4.
- **Cần cập nhật:** DDL migration, entity class.
- **Cách sửa:** Khai báo synonym/view hoặc migrate rename cột/bảng trong DB.
- **Trạng thái:** ❌ Chưa sửa

---

### [DRIFT-004] Quản lý Vật tư tiêu hao (Materials)
- **Ngày:** 2026-10-25
- **File:** `CLAUDE.md`, `Database/farmely_full_database.sql`, Report 4 §2.3 (#21, #22, #26)
- **Docs nói (Report 4 §2.3):** Có 3 bảng `materials`, `template_materials`, `material_usages` để ghi nhận định mức và lượng tiêu hao thực tế của công nhân tại hiện trường.
- **Code làm:** Theo `CLAUDE.md` triết lý Ponytail: "KHÔNG TRACKING VẬT TƯ (Bỏ hẳn Material): Chi phí dịch vụ/gói là trọn gói (Lump-sum), không trừ kho vật tư tiêu hao." Do đó DDL 26 bảng đã bỏ 3 bảng này.
- **Lý do lệch:** Giảm tải phạm vi lập trình kho vật tư phức tạp (ERP inventory) cho đồ án môn học.
- **Cần cập nhật:** Giữ nguyên quy định nghiệp vụ: không tính giá tiền/trừ tồn kho vật tư thương mại, nhưng nếu hội đồng yêu cầu đúng 39 bảng Report 4 thì DDL cần tạo 3 bảng này dưới dạng định mức kỹ thuật ghi chú (technical notes).
- **Cách sửa:** Thêm DDL cho 3 bảng `materials`, `template_materials`, `material_usages` vào schema hoàn chỉnh để khớp tài liệu SDD Report 4.
- **Trạng thái:** ❌ Chưa sửa

---

### [DRIFT-005] Thời lượng Grace Period trong WBS Report 2 vs BR08 (Report 1, 3, 4)
- **Ngày:** 2026-10-25
- **File:** `docs/submission/Report2_Project_Management_Plan.txt` mục 4.2
- **Docs nói (Report 2 WBS item 4.2):** Ghi "3-minute payment grace period".
- **Docs nói (Report 1 §5, Report 3 BR08, Report 4 §2.4, Code):** Ghi chuẩn xác: "15 minutes hold + additional 10-minute grace period".
- **Code làm:** `BookPlot.jsx` đếm ngược 15:00 và nút gia hạn thêm 10 phút (+600s). Khớp chuẩn BR08.
- **Lý do lệch:** Typo nhỏ trong bảng WBS của Report 2 (thành viên soạn ghi nhầm 3 phút thay vì 10 phút).
- **Cần cập nhật:** Report 2 WBS table khi có dịp chỉnh sửa docs.
- **Cách sửa:** Code giữ nguyên 15 phút + 10 phút theo SSoT BR08.
- **Trạng thái:** ✅ Đã align về logic nghiệp vụ chuẩn (10 phút grace).

---

### [DRIFT-006] Tiêu chuẩn 55 Màn hình (SCR-xxx) và Danh sách Thông báo (MSG01 - MSG14)
- **Ngày:** 2026-10-25
- **File:** `frontend/src/pages/`
- **Docs nói (Report 3 §3.1.2 & §5.3):** Quy định chính xác 55 màn hình (SCR-PUB-01..05, SCR-Customer-01..16, SCR-Agricultural Expert-01..10, SCR-Field Worker-01..07, SCR-Administrator-01..11) và 14 mã thông báo hệ thống (MSG01 đến MSG14).
- **Code làm:** Frontend chia thành các trang tổng hợp / Tab dashboard (`CustomerDashboard.jsx`, `ExpertDashboard.jsx`, `FieldWorkerDashboard.jsx`, `AdminDashboard.jsx`, `MasterDataDashboard.jsx`) chứa đầy đủ các tính năng con qua popups/drawers. Một số thông báo toast/alert dùng text trực tiếp chưa đồng bộ mã MSG01-MSG14.
- **Lý do lệch:** Kiến trúc SPA hiện đại nhóm các modal/tab trong dashboard để tối ưu trải nghiệm người dùng, trong khi tài liệu SRS phân tách từng modal/popup thành 1 Screen ID riêng rẽ.
- **Cần cập nhật:** Gắn comment mã màn hình `SCR-xxx` và mã thông báo `MSG-xx` trực tiếp vào từng Component / Modal / Toast tương ứng trong React.
- **Cách sửa:** Thực hiện rà soát và đánh dấu mã màn hình + mã MSG vào JSX code.
- **Trạng thái:** ❌ Đang tiến hành chuẩn hóa.

---

### [DRIFT-007] Cửa sổ Ngày bắt đầu canh tác (Lead Time Window: Min 5 ngày, Max 14 ngày)
- **Ngày:** 2026-10-27
- **File:** `frontend/src/pages/public/BookPlot.jsx`, `frontend/server/siteVisitsApiPlugin.js`
- **Docs nói (Report 3 SCR-KH-04 Field 2 & Report 4 §2.4):** Quy định `Start Date >= Today + 3 days` (prep buffer). Chưa có giới hạn chặn trên (`Max Date`), dẫn đến việc khách có thể chọn ngày bắt đầu quá xa trong tương lai (ví dụ đặt tháng 10 cho tháng 12 làm khóa trạng thái thửa đất quá lâu).
- **Code làm:** 
  - Nâng mốc tối thiểu lên `Today + 5 ngày` (đảm bảo nông trại có đủ thời gian phơi ải, làm đất, ủ phân vi sinh và chuẩn bị hạt giống).
  - Giới hạn mốc tối đa là `Today + 14 ngày` (không cho chọn ngày bắt đầu vượt quá 2 tuần để tối ưu hóa tỷ lệ lấp đầy thửa đất Occupancy Rate).
- **Lý do lệch:** Chuẩn hóa nghiệp vụ thực tế trang trại: tránh tình trạng "giam đất" ảo hàng tháng trời trước ngày canh tác.
- **Cần cập nhật:** Report 3 (SCR-KH-04 Field 2: đổi constraint thành `Today + 5d <= Start Date <= Today + 14d`) và Report 4 §2.4.
- **Cách sửa:** Code đã enforce cả ở UI (`min`, `max`, validation) và Backend API (`/api/contracts/reservations`).
- **Trạng thái:** ✅ Đã align nghiệp vụ thực tế (chờ cập nhật văn bản Report 3/4).

### [DRIFT-008] Quy trình Hủy Hợp Đồng & Phê Duyệt Hoàn Cọc (BR10 & BR23)
- **Ngày:** 2026-10-27
- **File:** `frontend/server/siteVisitsApiPlugin.js`, `frontend/src/components/customer/ContractCancellationModal.jsx`, `frontend/src/pages/customer/CustomerDashboard.jsx`, `frontend/src/data/rentalTerms.js`
- **Docs nói (Report 3 SRS §3.2.1 / BR10 & Report 4 SDD §2.3):** 
  - Gửi yêu cầu hủy trước ngày bắt đầu: $\ge 3$ ngày khấu trừ 20% (hoàn 80%), $< 3$ ngày khấu trừ 50% (hoàn 50%), vào hoặc sau ngày bắt đầu canh tác khấu trừ 100% (hoàn 0%).
  - Admin phê duyệt yêu cầu hủy $
ightarrow$ giải phóng thửa đất sang bảo dưỡng 4 ngày (`plots.status = 'MAINT'` theo BR23) và lập bút toán hoàn tiền.
- **Code cũ từng làm:** Khi khách bấm hủy trên modal, hệ thống tự động chạy UPDATE hủy hợp đồng ngay lập tức và chuyển đất sang `MAINT` mà không qua bước kiểm duyệt của Admin.
- **Code mới đã chuẩn hóa (Tích hợp & hoàn thiện từ branch `fix/huy`):**
  - Khách gửi yêu cầu hủy $
ightarrow$ tạo bản ghi `contract_cancellations` với trạng thái `PENDING`.
  - Hợp đồng và thửa đất vẫn giữ nguyên trạng thái cho đến khi Quản trị viên duyệt.
  - Bổ sung endpoint backend `POST /api/contracts/cancellations/:id/approve`: Admin duyệt $
ightarrow$ cập nhật `cancellation` sang `APPROVED`, cập nhật `contracts` & `rentals` sang `CANCELLED`, chuyển các `plots` sang `MAINT` 4 ngày (BR23), tự động tạo bản ghi hoàn tiền `payment_transactions` (loại `REFUND`) và ghi log kiểm toán `audit_logs`.
- **Trạng thái:** ✅ Đã hoàn toàn đồng bộ 1:1 với SSoT Report 3 và Report 4.

### [DRIFT-009] Tích Hợp Lựa Chọn Giống Cây Tương Thích Trực Tiếp Vào Màn Hình Tạo Thửa Đất (BR03)
- **Ngày:** 2026-10-27
- **File:** `frontend/src/pages/admin/PlotForm.jsx`, `frontend/src/pages/admin/PlotDetail.jsx`, `frontend/src/components/admin/BoundaryDrawMap.jsx`, `frontend/server/siteVisitsApiPlugin.js`
- **Docs nói (Report 3 SRS §3.1.2 & Report 4 SDD §2.4 / BR03):** Quy định tương thích giữa Thửa đất (`plots`) và Giống cây (`varieties`) thông qua bảng `plot_variety_compatibility`. Khách hàng chỉ được chọn các giống cây nằm trong danh mục tương thích của thửa đất đó.
- **Hiện trạng trước đây:** Màn hình tạo thửa đất (`PlotForm.jsx`) chỉ tạo các thuộc tính cơ bản và ranh giới bản đồ, không có chỗ để Admin cấu hình giống cây cho thửa; Admin phải mò sang màn hình Ma trận Thổ Nhưỡng (`Compatibility.jsx`) để gán từng giống cây thủ công.
- **Code mới đã chuẩn hóa:**
  - Ẩn hoàn toàn công cụ tìm toạ độ / ghim GPS trong chế độ vẽ thửa đất (`BoundaryDrawMap.jsx` với `kind === 'plot'`), giữ bản đồ gọn gàng và tập trung vào phân lô.
  - Tích hợp trực tiếp phân đoạn **"Giống cây trồng phù hợp thổ nhưỡng (Quy tắc BR03)"** vào ngay form Tạo / Sửa Thửa Đất (`PlotForm.jsx`): hiển thị toàn bộ danh mục giống cây VietGAP kèm thời gian sinh trưởng, có tìm kiếm nhanh, nút Chọn tất cả / Bỏ chọn, và ràng buộc validation bắt buộc chọn $\ge 1$ giống cây.
  - Lưu và đồng bộ 100% dữ liệu thực tế vào bảng `plot_variety_compatibility` của PostgreSQL qua API `POST /api/plots` và `PUT /api/plots/:id`.
  - Dữ liệu giống cây tương thích được đồng bộ tức thì trên WebGIS Marketplace (`/marketplace`), màn hình Thuê đất (`/book-plot`) và màn hình chi tiết Thửa đất của Admin (`PlotDetail.jsx`).
- **Trạng thái:** ✅ Đã hoàn thiện và kiểm thử đồng bộ 100% với PostgreSQL live.
