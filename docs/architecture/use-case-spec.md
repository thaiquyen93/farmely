# TÀI LIỆU ĐẶC TẢ SƠ ĐỒ USE CASE – NỀN TẢNG THUÊ PLOT VÀ THEO DÕI TRẢI NGHIỆM CANH TÁC
> **Môn học:** ISP392 – Information System Programming Project  
> **Phiên bản:** 3.0 – Clean Architecture View (OMG UML 2.5 & Triệt tiêu hoàn toàn lỗi Spaghetti/Spiderweb)  
> **Mã nguồn PlantUML tổng hợp:** [`use-case-diagram.puml`](../diagrams/use-case-diagram.puml)  
> **Thư mục ảnh sơ đồ:** [`docs/diagrams/`](../diagrams/)  

---

## 1. CÁC TÁC NHÂN TRONG HỆ THỐNG (ACTORS)

### 1.1. Tác nhân con người (Primary & Supporting Human Actors)
1. **KH – Khách hàng (Customer / Tenant):** Cư dân đô thị có nhu cầu thuê mảnh đất (Plot) tại trang trại ngoại ô để trải nghiệm tự canh tác (**Self-growing**) hoặc ủy thác dịch vụ chăm sóc trọn gói (**Assisted-growing**). Khách hàng tìm kiếm, đặt chỗ (khóa giữ 15 phút), thanh toán 100% trả trước, theo dõi chỉ số vi khí hậu IoT, xem Farm Diary, đặt dịch vụ phát sinh, chat với Chuyên gia Nông nghiệp và hỏi đáp AI Chatbot 24/7.
2. **CGNN – Chuyên gia nông nghiệp (Agri Expert):** Chuyên viên sinh học/nông học chịu trách nhiệm quản trị tri thức cây trồng, cấu hình bảng tương thích đất–cây (Plot–Crop Compatibility), biên soạn và đóng gói **Standard Process Template**, thiết lập ngưỡng an toàn IoT (Min/Max), quản trị tài liệu RAG cho AI, tư vấn trước thuê, hiệu chỉnh Cultivation Plan cho khách, đề xuất Plan Revision khi có sự cố và chat kỹ thuật với KH và CVLĐ.
3. **CVLĐ – Chuyên viên lao động (Field Staff):** Đội ngũ kỹ thuật viên hiện trường nhận việc chăm sóc hằng ngày từ Admin, thực hiện các thao tác chăm sóc (tưới nước, bón phân, làm cỏ, bắt sâu), bắt buộc chụp ảnh minh chứng hiện trường (Photo Evidence ≥ 1 ảnh), ghi nhận vật tư tiêu hao thực tế, tạo báo cáo sự cố (Issue Report), chat kỹ thuật với CGNN và hỗ trợ thu hoạch nông sản.
4. **AD – Administrator (Chủ trang trại / Quản trị viên):** Quản trị tài khoản và phân quyền vai trò (RBAC), quản lý hồ sơ Land và phân lô Plot, cấu hình giá thuê, gán mã cảm biến IoT, bật/tắt hiển thị Marketplace, điều phối phân công Care Task hằng ngày cho CVLĐ, quản lý danh mục dịch vụ lẻ, tiếp nhận và phân công Service Request, đối soát hợp đồng/giao dịch và theo dõi Dashboard doanh thu, tỷ lệ lấp đầy cùng System Audit Log.

### 1.2. Các hệ thống phụ trợ (Secondary / External Systems)
- **`<<System>>` Payment Gateway:** Cổng thanh toán trực tuyến (VNPay / MoMo / Stripe) xử lý thanh toán 100% trả trước khi kích hoạt hợp đồng thuê, thanh toán các đơn dịch vụ lẻ phát sinh và thực hiện hoàn tiền (Refund) tự động theo chính sách hủy (BR10).
- **`<<System>>` IoT & Sensors / Weather:** Trạm quan trắc vi khí hậu tự động thu thập và đẩy dữ liệu môi trường (Nhiệt độ, Độ ẩm không khí, Độ ẩm đất) theo từng Plot với chu kỳ 3 giờ/lần; đồng thời tích hợp API dự báo thời tiết địa phương 3–5 ngày.
- **`<<System>>` AI Service (LLM):** Hệ thống trí tuệ nhân tạo vận hành **AI Farming Assistant 24/7** trả lời kiến thức canh tác thường thức theo mô hình RAG (Retrieval-Augmented Generation) dựa trên kho tài liệu đã được CGNN thẩm định.

---

## 2. DANH MỤC 5 SƠ ĐỒ USE CASE (CLEAN ARCHITECTURE VIEW)

Toàn bộ 5 sơ đồ được thiết kế theo nguyên lý **Orthogonal Routing & User Goal Abstraction** (dây vuông góc, không cắt chéo, loại bỏ thao tác vụn vặt Fish-Level):

| STT | Tên sơ đồ | File PUML | File Ảnh PNG | Phạm vi mô tả |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **System Overview** | [`01_System_Overview.puml`](../diagrams/01_System_Overview.puml) | [`01_System_Overview.png`](../diagrams/01_System_Overview.png) | Toàn cảnh kiến trúc hệ thống: 4 Human Actors + 3 External Systems + 5 Phân hệ nghiệp vụ cốt lõi, dây vuông góc trực giao, không rối. |
| **02** | **Customer Subsystem** | [`02_Customer_Subsystem.puml`](../diagrams/02_Customer_Subsystem.puml) | [`02_Customer_Subsystem.png`](../diagrams/02_Customer_Subsystem.png) | 14 User Goals chuẩn mực chia 4 gói: Thuê đất, Quy trình chuẩn, Giám sát IoT/Nhật ký, Dịch vụ phát sinh & Thu hoạch. |
| **03** | **Agri Expert Subsystem** | [`03_Agri_Expert_Subsystem.puml`](../diagrams/03_Agri_Expert_Subsystem.puml) | [`03_Agri_Expert_Subsystem.png`](../diagrams/03_Agri_Expert_Subsystem.png) | 10 User Goals chia 3 gói: Tri thức cây, Standard Process Template, Review Cultivation Plan, AI RAG & Chat kỹ thuật. |
| **04** | **Field Staff Subsystem** | [`04_Field_Staff_Subsystem.puml`](../diagrams/04_Field_Staff_Subsystem.puml) | [`04_Field_Staff_Subsystem.png`](../diagrams/04_Field_Staff_Subsystem.png) | 8 User Goals chia 3 gói: Nhận task, Chụp ảnh nghiệm thu bắt buộc (BR15), Ghi vật tư, Báo sự cố hiện trường, Thu hoạch. |
| **05** | **Administrator Subsystem** | [`05_Admin_Subsystem.puml`](../diagrams/05_Admin_Subsystem.puml) | [`05_Admin_Subsystem.png`](../diagrams/05_Admin_Subsystem.png) | 10 User Goals chia 4 gói: Quản trị Land/Plot, RBAC, Phân công Care Task & Dịch vụ, Đối soát thanh toán, Dashboard & Audit Log. |

---

## 3. ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ

### 3.1. Phân Hệ Khách Hàng (Customer Subsystem – 14 User Goals)

#### Gói 1: Marketplace & Thuê đất (Marketplace & Rental)
- **`UC-CUS01: Search & View Plot Details`**: Khách hàng tìm kiếm, lọc theo tiêu chí (vị trí, diện tích, giá, loại cây tương thích) và xem hồ sơ chi tiết thửa đất (chất đất, nguồn nước, vi khí hậu hiện tại).
- **`UC-CUS02: Request Pre-rental Consultation`**: Gửi yêu cầu tư vấn trước thuê tới CGNN trực tiếp từ trang chi tiết thửa đất. *(Quan hệ: `UC-CUS02 ..> UC-CUS01 : <<extend>>`; Tác nhân phụ: `CGNN`)*.
- **`UC-CUS03: Book Plot (Select Crop, Period & Cultivation Mode)`**: Khách hàng chọn giống cây tương thích, khoảng thời gian thuê (Start Date – End Date), và **chọn luôn hình thức canh tác (Self-growing hoặc Assisted-growing)**.
- **`UC-CUS04: Create Reservation (15-min Lock)`**: Hệ thống tự động kiểm tra tính khả dụng, chống trùng lịch và khóa giữ chỗ lô đất trong 15 phút. *(Quan hệ: `UC-CUS03 ..> UC-CUS04 : <<include>>` – việc đặt chỗ bắt buộc phải kích hoạt khóa giữ chỗ)*.
- **`UC-CUS05: Pay Rental Fee (100% Upfront via Gateway)`**: Thanh toán toàn bộ 100% tiền thuê đất (cộng phí chăm sóc nếu chọn Assisted-growing). Khi thanh toán thành công, hợp đồng chuyển sang `Confirmed`/`Active`. *(Tác nhân phụ: `Payment Gateway`)*.
- **`UC-CUS06: Request Rental Cancellation & Refund`**: Khách hàng chủ động yêu cầu hủy hợp đồng thuê trước ngày bắt đầu canh tác theo chính sách hoàn tiền tại BR10 (hủy trước `Start Date` ≥ 03 ngày: hoàn 80%; < 03 ngày: hoàn 50%; đã chuyển `Active`: 0%). *(Tác nhân phụ: `Payment Gateway`)*.

#### Gói 2: Quy trình & Kế hoạch Canh tác (Cultivation & Process Planning)
- **`UC-CUS07: View Standard Process Guide (Self-growing)`**: Khách hàng (đặc biệt là hình thức Self-growing) tra cứu tài liệu quy trình chuẩn do CGNN biên soạn làm cẩm nang kỹ thuật thực hành.
- **`UC-CUS08: Approve Cultivation Plan (Assisted - 48h SLA)`**: Đối với hình thức Assisted-growing, Khách hàng xem xét kế hoạch canh tác do CGNN tùy biến từ Standard Process Template và nhấn Phê duyệt. Nếu quá 48 giờ khách hàng không phản hồi, hệ thống tự động kích hoạt kế hoạch theo BR12. *(Tác nhân phụ: `CGNN`)*.

#### Gói 3: Giám sát IoT & Nhật ký vườn (Monitoring & Farm Diary)
- **`UC-CUS09: Monitor IoT Telemetry & Weather Forecast`**: Theo dõi chỉ số vi khí hậu thời gian thực (Nhiệt độ, Độ ẩm đất, Độ ẩm không khí) và biểu đồ lịch sử từ cảm biến gắn tại Plot; đồng thời xem dự báo thời tiết 3–5 ngày. *(Tác nhân phụ: `IoT & Weather`)*.
- **`UC-CUS10: View Farm Diary Timeline`**: Xem dòng thời gian hoạt động của thửa ruộng (chăm sóc, tưới tiêu, bón phân, ảnh chụp nghiệm thu tự động từ CVLĐ).
- **`UC-CUS11: Record Personal Diary Entry (Self-growing)`**: Dành riêng cho khách hàng tự canh tác tự tải ảnh, ghi chép nhật ký trải nghiệm thực tế tại vườn. *(Quan hệ: `UC-CUS11 ..> UC-CUS10 : <<extend>>`)*.

#### Gói 4: Dịch vụ phát sinh, Tư vấn & Thu hoạch (Services, Advisory & Harvest)
- **`UC-CUS12: Order Ad-hoc Care Service`**: Đặt các gói dịch vụ chăm sóc đột xuất khi khách hàng bận (tưới thêm, nhổ cỏ, bắt sâu) và thanh toán ngay qua cổng thanh toán. *(Tác nhân phụ: `Payment Gateway`)*.
- **`UC-CUS13: Consult Agri Expert & AI Assistant 24/7`**: Chat 1-1 với CGNN về chẩn đoán sâu bệnh qua ảnh và hỏi đáp 24/7 với trợ lý ảo AI RAG về kỹ thuật làm vườn thường thức. *(Tác nhân phụ: `CGNN`, `AI Service (LLM)`)*.
- **`UC-CUS14: Confirm Harvest Result & View Rental History`**: Kiểm tra sản lượng thu hoạch, ảnh chụp nông sản đóng gói, xác nhận phương thức nhận hàng và xem lại hồ sơ các hợp đồng thuê đã hoàn thành ở chế độ chỉ đọc (Read-only).

---

### 3.2. Phân Hệ Chuyên Gia Nông Nghiệp (Agri Expert Subsystem – 10 User Goals)

#### Gói 1: Quản trị Tiêu chuẩn & Tri thức Nông học (Agronomy Standards & Knowledge)
- **`UC-EXP01: Manage Crops & Compatibility Rules`**: Tạo lập và cập nhật danh mục loài cây, giống rau và thiết lập ma trận tương thích giữa đặc điểm thổ nhưỡng của từng lô đất với các giống cây trồng (BR03).
- **`UC-EXP02: Update Ecological & Soil Characteristics`**: Cấu hình chi tiết đặc tính sinh thái, nhu cầu dinh dưỡng, độ pH, loại đất phù hợp cho từng giống cây. *(Quan hệ: `UC-EXP01 ..> UC-EXP02 : <<include>>`)*.
- **`UC-EXP03: Manage Standard Process Templates`**: Quản lý các quy trình chuẩn mẫu dùng để sinh Cultivation Plan hoặc hướng dẫn cho khách hàng.
- **`UC-EXP04: Define Growth Stages & IoT Thresholds`**: Phân chia các giai đoạn sinh trưởng kèm số ngày định mức, định mức vật tư và cài đặt ngưỡng cảnh báo vi khí hậu an toàn (nhiệt độ min/max, độ ẩm đất min/max). *(Quan hệ: `UC-EXP03 ..> UC-EXP04 : <<include>>`)*.
- **`UC-EXP05: Manage Agronomy Docs (AI RAG Knowledge Base)`**: Đăng tải và chuẩn hóa các tài liệu nông học chuyên sâu làm cơ sở tri thức đầu vào cho hệ thống AI Chatbot. *(Tác nhân phụ: `AI Service (LLM)`)*.

#### Gói 2: Kế hoạch Canh tác & Tư vấn (Cultivation Planning & Consultation)
- **`UC-EXP06: Conduct Pre-rental Consultation`**: Tiếp nhận và phản hồi các yêu cầu tư vấn trước khi thuê của khách hàng. *(Tác nhân phụ: `Customer`)*.
- **`UC-EXP07: Review & Customize Cultivation Plan`**: Tiếp nhận hợp đồng thuê mới, tùy biến quy trình mẫu thành Cultivation Plan cụ thể và gửi cho khách hàng phê duyệt. *(Tác nhân phụ: `Customer`)*.
- **`UC-EXP08: Propose Cultivation Plan Revision`**: Đề xuất điều chỉnh các công việc tương lai trong kế hoạch canh tác khi có thiên tai, sâu bệnh. Kế hoạch mới cần sự đồng thuận của khách hàng. *(Quan hệ: `UC-EXP08 ..> UC-EXP10 : <<extend>>`; Tác nhân phụ: `Customer`)*.

#### Gói 3: Cố vấn & Hỗ trợ Hiện trường (Advisory & Technical Support)
- **`UC-EXP09: 1-on-1 Agronomy Chat with Customer (Pest/Advice)`**: Trao đổi kỹ thuật, xem ảnh triệu chứng bệnh cây và kê đơn xử lý cho khách hàng. *(Tác nhân phụ: `Customer`)*.
- **`UC-EXP10: Handle Field Issues & Technical Chat with Staff`**: Tiếp nhận báo cáo sự cố vườn từ CVLĐ (sâu bệnh, gãy cành, đất khô...) và chat kỹ thuật chỉ đạo xử lý tại chỗ. *(Tác nhân phụ: `Field Staff`)*.

---

### 3.3. Phân Hệ Chuyên Viên Lao Động (Field Staff Subsystem – 8 User Goals)

#### Gói 1: Tiếp nhận Công việc (Task Reception)
- **`UC-STF01: View Assigned Tasks & Plot Location`**: Xem danh sách các công việc chăm sóc được phân công theo ca làm việc trong ngày và vị trí thửa đất cần thực hiện.
- **`UC-STF02: View Technical Guide & Material Specs`**: Đọc kỹ hướng dẫn kỹ thuật, cách thức thực hiện và định lượng vật tư cần chuẩn bị từ Standard Process. *(Quan hệ: `UC-STF02 ..> UC-STF01 : <<extend>>`)*.

#### Gói 2: Thực thi & Nghiệm thu (Execution & Evidence)
- **`UC-STF03: Update Task Progress (In Progress)`**: Chuyển trạng thái công việc sang `IN_PROGRESS` khi bắt đầu thực hiện tại luống đất.
- **`UC-STF04: Confirm Task Completion`**: Đóng task chuyển sang trạng thái `COMPLETED`. Dữ liệu và ảnh nghiệm thu được tự động đẩy vào Farm Diary của khách hàng.
- **`UC-STF05: Upload Photo Evidence (Required >= 1)`**: Chụp và tải ảnh hiện trường làm minh chứng nghiệm thu thực tế bắt buộc theo BR15. *(Quan hệ: `UC-STF04 ..> UC-STF05 : <<include>>`)*.
- **`UC-STF06: Log Material Usage`**: Ghi nhận số lượng vật tư thực tế đã tiêu hao (phân bón, thuốc bảo vệ sinh học, nước tưới). *(Quan hệ: `UC-STF06 ..> UC-STF04 : <<extend>>`)*.

#### Gói 3: Sự cố & Thu hoạch (Issues & Harvest)
- **`UC-STF07: Report Field Issue & On-site Chat with Expert`**: Báo cáo bất thường tại luống đất kèm ảnh chụp hiện trường gửi tới CGNN và mở phiên chat kỹ thuật xin chỉ đạo tại chỗ. *(Tác nhân phụ: `Agri Expert`)*.
- **`UC-STF08: Assist Harvest & View Work History`**: Hỗ trợ cắt hái, cân định lượng nông sản, bàn giao cho khách hàng và tra cứu lịch sử các ca làm việc đã hoàn thành. *(Tác nhân phụ: `Customer`)*.

---

### 3.4. Phân Hệ Administrator (Admin Subsystem – 10 User Goals)

#### Gói 1: Định danh & Phân quyền (Identity & Access)
- **`UC-ADM01: Manage User Accounts & Security Lock`**: Tra cứu hồ sơ người dùng, kích hoạt hoặc khóa tài khoản khi có vi phạm. Mọi thao tác đều được ghi vào Audit Log.
- **`UC-ADM02: Assign Roles (RBAC)`**: Phân quyền vai trò tài khoản trong hệ thống theo cơ chế RBAC (`ROLE_CUSTOMER`, `ROLE_EXPERT`, `ROLE_STAFF`, `ROLE_ADMIN`). *(Quan hệ: `UC-ADM02 ..> UC-ADM01 : <<extend>>`)*.

#### Gói 2: Quỹ đất & Cấu hình Marketplace (Land & Marketplace)
- **`UC-ADM03: Manage Land Records & Plot Partitions`**: Quản lý hồ sơ khu đất (vị trí địa lý, tọa độ GPS, diện tích tổng thể, nguồn nước) và chia tách khu đất thành các thửa Plot nhỏ.
- **`UC-ADM04: Configure Rental Pricing & Marketplace Visibility`**: Cài đặt biểu giá cho thuê theo ngày/tháng cho từng phân khu Plot và bật/tắt hiển thị thửa Plot trên Marketplace.
- **`UC-ADM05: Attach IoT Sensor to Plot`**: Gắn mã thiết bị trạm cảm biến (`iot_device_code`) vào thửa Plot phục vụ đo đạc vi khí hậu. *(Quan hệ: `UC-ADM05 ..> UC-ADM03 : <<extend>>`)*.

#### Gói 3: Điều phối Vận hành (Operations & Dispatch)
- **`UC-ADM06: Dispatch Care Tasks to Field Staff`**: Điều phối và gán các Care Task định kỳ sinh ra từ kế hoạch canh tác cho nhân viên hiện trường. *(Tác nhân phụ: `Field Staff`)*.
- **`UC-ADM07: Manage Service Catalog & Dispatch Requests`**: Cập nhật danh mục gói dịch vụ chăm sóc phát sinh và phân bổ yêu cầu dịch vụ lẻ từ khách hàng cho CVLĐ trực tiếp thực hiện. *(Tác nhân phụ: `Field Staff`)*.
- **`UC-ADM08: Monitor Reservations, Rentals & Payment Audit`**: Theo dõi danh sách đơn giữ chỗ (15 phút), hợp đồng đang hiệu lực, kiểm soát trạng thái giao dịch thanh toán và đối soát hoàn tiền. *(Tác nhân phụ: `Payment Gateway`)*.

#### Gói 4: Giám sát Môi trường & Báo cáo (Monitoring & Governance)
- **`UC-ADM09: Monitor IoT Alerts & Environmental Health`**: Giám sát trung tâm cảnh báo vi khí hậu toàn trang trại để kịp thời chỉ đạo xử lý sự cố. *(Tác nhân phụ: `IoT Gateway`)*.
- **`UC-ADM10: View Analytics Dashboard & System Audit Log`**: Xem biểu đồ doanh thu, tỷ lệ lấp đầy, tỷ lệ Self vs Assisted và truy vết nhật ký hệ thống chống gian lận.

---

## 4. TỔNG KẾT NGUYÊN TẮC THIẾT KẾ CLEAN ARCHITECTURE

1. **Orthogonal Routing (Dây trực giao vuông góc):** Sử dụng `skinparam linetype ortho` kết hợp bố cục thẳng đứng. Toàn bộ các đường dây đi theo các góc vuông 90 độ song song, loại bỏ hoàn toàn các đường cong chéo nhau như mạng nhện.
2. **Quy tắc 7 ± 2 của Miller:** Mỗi phân hệ được tinh giản chỉ còn từ 8 đến 14 Use Cases tập trung vào giá trị người dùng cốt lõi (User Goal level).
3. **Loại bỏ dây thừa vào `<<include>>`:** Actor chỉ nối với Base Use Case. Use case con được hệ thống kích hoạt tự động nên không nối dây từ Actor.
4. **Phân ranh giới rõ ràng:** Primary Actor bên trái, Secondary/System Actors bên phải, ranh giới Subsystem Boundary đóng khung chữ nhật phân minh.
