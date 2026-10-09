import re

with open("docs/academic/SRS_Farmely_v1.md", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Section 1 to add SCR-PUB-05
pub4_end = content.find("### c. Quên mật khẩu (SCR-PUB-04)")
pub4_next = content.find("## 2. Marketplace & Thuê Plot")

pub5_content = """### c. Quên mật khẩu (SCR-PUB-04)

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

"""

content = content[:pub4_end] + pub5_content + content[pub4_next:]

# 2. Update Section 2: Marketplace & Hợp đồng Thuê Plot
sec2_start = content.find("## 2. Marketplace & Thuê Plot")
sec3_start = content.find("## 3. Quy trình Canh tác")

sec2_new = """## 2. Marketplace & Hợp đồng Thuê Plot

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
2. Admin duyệt đơn $\rightarrow$ Hệ thống tự động phát sinh bản ghi `payment_transactions` loại `REFUND` với số tiền `refund_amount`.
3. Hợp đồng chuyển sang `TERMINATED`, thửa đất chuyển sang trạng thái `MAINTENANCE` đúng 04 ngày phơi ải rồi mới mở lại `AVAILABLE` (BR23).

---

"""

content = content[:sec2_start] + sec2_new + content[sec3_start:]

# 3. Update Section 3: Quy trình Canh tác Chuẩn theo Giống cây
sec3_start = content.find("## 3. Quy trình Canh tác")
sec4_start = content.find("## 4. Vận hành & Chăm sóc")

sec3_new = """## 3. Quy trình Canh tác Chuẩn theo Giống cây

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

"""

content = content[:sec3_start] + sec3_new + content[sec4_start:]

# 4. Update Section 6: Nhật ký & Thu hoạch (Staff Harvest + Delivery options)
sec6_start = content.find("## 6. Nhật ký & Thu hoạch")
sec7_start = content.find("## 7. Trò chuyện & Tư vấn")

sec6_new = """## 6. Nhật ký & Thu hoạch

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

"""

content = content[:sec6_start] + sec6_new + content[sec7_start:]

# 5. Update Section 9: SCR-AD-06 Quản lý Danh mục Dịch vụ Master
ad6_start = content.find("### c. Quản lý danh mục Dịch vụ (SCR-AD-06)")
ad7_start = content.find("### d. Giám sát Rental (SCR-AD-07)")

ad6_new = """### c. Quản lý Danh mục Dịch vụ Master (SCR-AD-06)

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

"""

content = content[:ad6_start] + ad6_new + content[ad7_start:]

# Write back
with open("docs/academic/SRS_Farmely_v1.md", "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated SRS_Farmely_v1.md Part II!")
