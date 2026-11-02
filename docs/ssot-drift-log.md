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

### [DRIFT-010] Loại Bỏ Hoàn Toàn Phần Cứng IoT Mô Phỏng — Thay Bằng Dịch Vụ API Thời Tiết Thực Địa (Weather API & Agro-climate Service)
- **Ngày:** 2026-10-31
- **File:** `CLAUDE.md`, `frontend/src/pages/admin/AdminDashboard.jsx`, `frontend/src/pages/staff/FieldWorkerDashboard.jsx`, `frontend/src/pages/admin/IoTStations.jsx`, `docs/requirements/screen-description.md`, `docs/requirements/user-stories.md`, `docs/academic/RP39 (NEW).md`, `docs/submission/Report3_Software_Requirement_Specification.txt`, `docs/submission/Report4_Software_Design_Document.txt`
- **Docs cũ nói:** Tài liệu cũ đề cập đến Actor "IoT Sensor Station (Hardware Device)", cảm biến đo độ ẩm đất, LoRaWAN/4G, trạm quan trắc IoT vi khí hậu mô phỏng.
- **Vấn đề / Lý do đổi:** Đồ án là phần mềm Web/Cloud, việc đưa khái niệm phần cứng IoT/cảm biến vật lý hoặc mô phỏng phần cứng gây khó hiểu và bị hội đồng chất vấn tính khả thi của phần cứng ngoài phạm vi phần mềm. Thay vào đó, việc tích hợp **Dịch vụ API Thời Tiết Thực Địa & Khí Tượng Nông Nghiệp (Weather API & Agro-meteorological Service - ví dụ Open-Meteo / OpenWeatherMap)** dựa trên tọa độ GPS thực tế của từng trang trại là hoàn toàn thực tế, giải quyết 100% bài toán phần mềm kỹ nghệ.
- **Quy chuẩn mới thống nhất:**
  - Thay thế toàn bộ Actor "IoT Station (Hardware Device)" thành "Weather & Agro-climate API Service (External System)".
  - Dữ liệu vi khí hậu (Nhiệt độ, Độ ẩm không khí, Lượng mưa, Tốc độ gió, Độ ẩm đất ước tính theo cân bằng ẩm khí tượng) được cập nhật tự động từ API thời tiết theo tọa độ địa lý (GPS) của từng nông trại.
  - Quy tắc **BR18**: Tự động phát hiện điều kiện cực đoan (sốc nhiệt, hạn hán) và tự động hoãn lịch tưới khi lượng mưa hoặc xác suất mưa dự báo từ Weather API $\ge 70\%$.
  - Toàn bộ UI (Admin Dashboard, Field Worker Dashboard, Marketplace Plot Detail) đổi nhãn từ "Trạm IoT" sang "Thời Tiết & Khí Tượng Nông Nghiệp (Weather API)".
- **Trạng thái:** ✅ Đã đồng bộ toàn bộ tài liệu và mã nguồn hệ thống.

### [DRIFT-011] Thu Hẹp Phạm Vi BR21 — Khách Hàng Chỉ Theo Dõi Kết Quả Thu Hoạch, Không Nghiệm Thu Nhận Nông Sản
- **Ngày:** 2026-11-02
- **File:** `frontend/src/components/customer/CustomerPlotWorkspace.jsx` (`PLOT_TABS` dòng 23, `heroStats` dòng ~2731), `frontend/src/pages/customer/CustomerDashboard.jsx` (`fetchHarvestResults` dòng ~1625), `frontend/src/pages/staff/FieldWorkerDashboard.jsx` (dòng ~622, ~1940, ~2957), `frontend/server/siteVisitsApiPlugin.js` (dòng 2566)
- **Docs nói:**
  - Report 3 SRS §3.7, bảng MSG: `M15.2 | Yield approved | "Harvest approved. Prepare for pickup or delivery." | Toast (Success)`.
  - Report 3 SRS (BR18, BR19, BR20, BR21): *"Once accepted and the lease term ends, the plot automatically enters status = 'MAINTENANCE' for a fixed 4-day soil turnaround before reopening as AVAILABLE."*
  - Report 3 SRS, bảng BR: `BR21 | Harvest Time and Location. Harvesting takes place at the farm at the end of the cultivation season.`
  - `RP39 (NEW).md:235` / `research-proposal.md:235` — **BR21 – Quyền quyết định sản lượng & Chính sách vận chuyển:** *"Khách có quyền tự đến nhận tại vườn cuối mùa vụ (miễn phí) hoặc yêu cầu giao tận nhà (tính phí ship)."*
- **Code làm:**
  - Quy trình thu hoạch kết thúc tại bước CVLĐ cân thực tế + chụp ảnh đối chứng (BR20). `POST /api/harvest` ghi `harvest_results` với `customer_confirmed = false`, `delivery_type = 'PICKUP'` mặc định.
  - Phía Khách hàng **không còn** tab Thu hoạch (`PLOT_TABS` chỉ còn: Tổng quan · Hoạt động Staff · Nhật ký · Dịch vụ), không còn nút nghiệm thu / chọn phương thức nhận nông sản. Kết quả thu hoạch (khối lượng, ảnh đối chứng, tên CVLĐ) hiển thị **chỉ đọc** trong tab Nhật ký (`DiaryTab`).
  - Phía CVLĐ đã gỡ badge `⏳ Chờ khách xác nhận` / `✓ Khách đã nghiệm thu` và dòng "Trạng thái nghiệm thu" khỏi biên bản bàn giao; phiếu tính `COMPLETED` ngay khi `yield_amount > 0`.
  - Cột `harvest_results.customer_confirmed` và `delivery_type` **vẫn giữ nguyên trong DDL** (không thay đổi ERD), nhưng trên thực tế luôn ở giá trị lúc CVLĐ insert vì không có UI ghi đè.
  - Endpoint `POST /api/customer/harvest-results/confirm` giữ lại ở backend (phục vụ đối soát dữ liệu / Admin), đánh dấu rõ là không có client nào gọi.
- **Lý do lệch:** **User yêu cầu trực tiếp** — *"ở cái thu hoạch của staff bỏ hẳn cái chờ khách hàng xác nhận đi vì không cần thiết và ko làm tới mức độ đó"*. Nghiệp vụ nghiệm thu hai chiều (KH xác nhận → chốt phương thức giao → tính phí ship) vượt phạm vi đồ án ISP392, không đủ thời gian làm trọn vẹn và không phải trọng tâm bảo vệ.
- **Cần cập nhật:** Report 3 (SRS) — xoá thông điệp `M15.2 Yield approved` khỏi bảng MSG của §3.7; diễn giải lại BR21 trong SRS theo hướng *"Khách hàng theo dõi kết quả thu hoạch (khối lượng thực cân + ảnh đối chứng) trên Nhật ký; mặc định tự nhận tại vườn cuối mùa vụ"*. Screen Spec — xoá màn hình/khối nghiệm thu nhận nông sản phía KH. **ERD / DDL: KHÔNG đổi** (giữ `customer_confirmed`, `delivery_type`).
- **Cách sửa (nếu muốn align lại code theo docs):** Thêm lại tab `harvest` vào `PLOT_TABS`, dựng `HarvestTab` với nút chọn `PICKUP` / `DELIVERY`, gọi `POST /api/customer/harvest-results/confirm` (endpoint đã sẵn sàng, không cần viết thêm backend), rồi bật lại badge trạng thái nghiệm thu phía CVLĐ.
- **Lập luận bảo vệ trước hội đồng:** BR21 về bản chất là **quyền của khách** (quyền quyết định sản lượng), không phải **nghĩa vụ xác nhận trong hệ thống**. Sản lượng đã thuộc về khách theo hợp đồng thuê (Lump-sum trả trước 100%), nên không cần một bước phê duyệt điện tử để chuyển giao quyền sở hữu. Hệ thống đảm bảo tính minh bạch bằng **bằng chứng một chiều từ CVLĐ** (ảnh cân điện tử tại hiện trường + `staff_id` người cân theo BR20) — đây mới là cơ chế chống gian lận thực sự. Mặc định "tự nhận tại vườn" đúng với `BR21 | Harvest Time and Location` trong SRS: *thu hoạch diễn ra tại nông trại*.
- **Trạng thái:** ❌ Chưa align docs (code đã chốt theo yêu cầu user; cần sửa Report 3 khi nộp bản cập nhật)

### [DRIFT-012] Khép Kín Vòng Đời Thu Hoạch — Đóng Task Trong CSDL (BR20), Sinh Nhiệm Vụ Vụ Mới Khi Gia Hạn (BR11b), Phơi Ải 4 Ngày Khi Hết Hạn Tự Nhiên (BR23)
- **Ngày:** 2026-11-02
- **File:** `frontend/server/siteVisitsApiPlugin.js` (khối đồng bộ BR23 dòng ~128, thanh lý hợp đồng dòng ~1491, `POST /api/harvest` dòng ~2534, `POST /api/rentals/:id/renew` dòng ~4910), `frontend/server/checks/harvestLifecycle.check.mjs` (mới)
- **Docs nói:**
  - `RP39 (NEW).md` **BR20** — CVLĐ nghiệm thu thực địa, mỗi bản ghi thu hoạch phải có `staff_id` người cân.
  - `RP39 (NEW).md` **BR11b** — gia hạn vụ mùa mới trước 3 ngày kết thúc.
  - `RP39 (NEW).md` **BR23** — *"Plot hết hợp đồng chuyển status Maintenance trong 4 ngày trước khi cho thuê lại."*
  - Report 3 SRS (BR18–BR21): *"Once accepted and the lease term ends, the plot automatically enters status = 'MAINTENANCE' for a fixed 4-day soil turnaround before reopening as AVAILABLE."*
- **Code làm (TRƯỚC khi sửa — 4 lỗ hổng thật):**
  1. `POST /api/harvest` chỉ `INSERT harvest_results`, **không** `UPDATE care_tasks`. UI chỉ đổi React state → **F5 là nhiệm vụ thu hoạch hiện lại `PENDING`**, dữ liệu CSDL không bao giờ phản ánh việc đã làm.
  2. `POST /api/rentals/:id/renew` chỉ nới `end_date` + `total_price`, **không sinh `care_tasks`** từ `template_steps` cho vụ mới → khách trả tiền vụ 2 nhưng CVLĐ không có việc, nhật ký trống.
  3. BR23 chỉ chạy trong nhánh **thanh lý hợp đồng thủ công**. Hết hạn tự nhiên thì `rentals` **nằm `ACTIVE` vĩnh viễn** (không có cơ chế nào đóng theo `end_date`), nên điều kiện `plot NOT IN (SELECT plot_id FROM rentals WHERE status='ACTIVE')` **chưa bao giờ đúng** → 4 ngày phơi ải không bao giờ xảy ra.
  4. Nhánh thanh lý set `care_tasks.status = 'CANCELLED'` — nhưng `task_status_enum` chỉ có `('PENDING','IN_PROG','DONE')`. **Đã kiểm chứng trên CSDL thật: PostgreSQL ném `invalid input value for enum task_status_enum: "CANCELLED"`** → toàn bộ block `DO $$` thanh lý hợp đồng rollback, Admin duyệt thanh lý thất bại.
- **Code làm (SAU khi sửa):**
  - `POST /api/harvest` dùng CTE `closed_tasks`: cùng transaction với `INSERT harvest_results`, set `care_tasks.status = 'DONE'` + lưu `evidence_image_url` cho task thu hoạch (khớp theo `title LIKE '%thu hoạch%'` hoặc `step_id` trỏ `template_steps.step_name LIKE '%thu hoạch%'`).
  - `/renew` sinh đủ bộ `care_tasks` từ `template_steps` của giống (hỗ trợ cả đổi giống luân canh), mốc xuống giống vụ mới = `CURRENT_DATE + 4 ngày` (tôn trọng phơi ải BR23), có guard `NOT EXISTS` khớp **đúng `step_id` + đúng `due_date`** để bấm gia hạn 2 lần không sinh task trùng. Bỏ qua khi `cultivation_mode = 'SELF'`.
  - Khối đồng bộ BR23 viết lại 4 bước: (1) `rentals ACTIVE` quá `end_date` → `DONE`; (2) thửa vừa kết thúc trong 4 ngày → `MAINT` + `is_published = false`; (3) qua 4 ngày (cửa sổ 4–30 ngày) → `AVAIL`; (3b) dọn thửa `RENT` mồ côi không có lượt thuê nào.
  - Nhánh thanh lý đổi `UPDATE ... SET status='CANCELLED'` → `DELETE FROM care_tasks ... WHERE status <> 'DONE'` (hợp enum, giữ lịch sử việc đã làm).
- **Lý do lệch:** Lỗi triển khai (các BR có trong docs nhưng code chưa khép vòng), không phải thay đổi phạm vi. **Không thêm/sửa bảng hay cột nào — ERD & DDL giữ nguyên 100%**; mốc đếm 4 ngày tái sử dụng `rentals.end_date` thay vì thêm cột mới.
- **Cần cập nhật:** Không. Code nay **đúng theo docs**, đây là lần align chứ không phải lệch mới.
- **Kiểm chứng:** `node server/checks/harvestLifecycle.check.mjs` (từ `frontend/`) — chạy trong transaction + `ROLLBACK` nên không làm bẩn dữ liệu demo. **Kết quả: 14 pass / 0 fail** trên PostgreSQL live, bao gồm: task thu hoạch chuyển `DONE` thật trong CSDL; gia hạn sinh đủ 9 nhiệm vụ vụ mới; gọi 2 lần không trùng; vụ mới bắt đầu đúng `+4 ngày`; thửa vừa hết hạn → `MAINT` và bị ẩn khỏi marketplace; thửa hết hạn >4 ngày → `AVAIL`; thửa còn hợp đồng giữ `RENT`; rental quá hạn → `DONE`.
- **Trạng thái:** ✅ Đã align code với docs, kiểm chứng trên CSDL thật
