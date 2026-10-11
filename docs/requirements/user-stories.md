# TÀI LIỆU ĐẶC TẢ USER STORIES – NỀN TẢNG THUÊ PLOT VÀ THEO DÕI TRẢI NGHIỆM CANH TÁC
> **Môn học:** ISP392 – Information System Programming Project  
> **Phiên bản:** 2.2 (Đồng bộ research-proposal.md v2.1 – Bộ 27 Business Rules BR01–BR27)  
> **Cấu trúc phân hệ:** 9 Epics – 4 Human Actors: KH, CGNN, CVLĐ, AD  

---

## 📑 MỤC LỤC CÁC EPIC
- [EPIC 1: QUẢN LÝ TÀI KHOẢN VÀ XÁC THỰC (AUTHENTICATION & RBAC)](#epic-1-quản-lý-tài-khoản-và-xác-thực-authentication--rbac)
- [EPIC 2: QUẢN TRỊ TÀI NGUYÊN ĐẤT VÀ MARKETPLACE (AD)](#epic-2-quản-trị-tài-nguyên-đất-và-marketplace-ad)
- [EPIC 3: MARKETPLACE, TƯ VẤN TRƯỚC THUÊ VÀ THUÊ PLOT (KH)](#epic-3-marketplace-tư-vấn-trước-thuê-và-thuê-plot-kh)
- [EPIC 4: TRI THỨC NÔNG NGHIỆP VÀ QUY TRÌNH CHUẨN (CGNN)](#epic-4-tri-thức-nông-nghiệp-và-quy-trình-chuẩn-cgnn)
- [EPIC 5: KẾ HOẠCH CANH TÁC VÀ 2 NHÁNH SELF/ASSISTED (KH & CGNN)](#epic-5-kế-hoạch-canh-tác-và-2-nhánh-selfassisted-kh--cgnn)
- [EPIC 6: ĐIỀU PHỐI VÀ THỰC THI CARE TASK (AD & CVLĐ)](#epic-6-điều-phối-và-thực-thi-care-task-ad--cvlđ)
- [EPIC 7: FARM DIARY, GIÁM SÁT IOT VÀ THỜI TIẾT](#epic-7-farm-diary-giám-sát-iot-và-thời-tiết)
- [EPIC 8: TƯ VẤN CHUYÊN GIA, KÊNH CHAT VÀ AI CHATBOT](#epic-8-tư-vấn-chuyên-gia-kênh-chat-và-ai-chatbot)
- [EPIC 9: THU HOẠCH, KẾT THÚC HỢP ĐỒNG VÀ BÁO CÁO VẬN HÀNH](#epic-9-thu-hoạch-kết-thúc-hợp-đồng-và-báo-cáo-vận-hành)
- [PHỤ LỤC: MA TRẬN PHÂN QUYỀN VÀ BUSINESS RULES](#phụ-lục-ma-trận-phân-quyền-và-business-rules)

---

## EPIC 1: QUẢN LÝ TÀI KHOẢN VÀ XÁC THỰC (AUTHENTICATION & RBAC)

### US1.1: Đăng ký tài khoản Khách hàng
**Là** Người dùng mới (Khách thuê tiềm năng)  
**Tôi muốn** Đăng ký tài khoản cá nhân trên hệ thống bằng Email và Mật khẩu  
**Để** Có thể tìm kiếm, đặt chỗ và quản lý mảnh vườn canh tác của mình  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Form đăng ký yêu cầu: Họ và tên, Email hợp lệ, Số điện thoại (10 chữ số), Mật khẩu (tối thiểu 8 ký tự gồm chữ hoa, chữ thường và số).
- Hệ thống kiểm tra trùng lặp email và số điện thoại trong cơ sở dữ liệu.
- Tài khoản mới tự động được gán vai trò mặc định: `ROLE_CUSTOMER`.
- Gửi email xác thực kích hoạt tài khoản.
- Hiển thị thông báo đăng ký thành công và điều hướng sang trang Đăng nhập.

### US1.2: Đăng nhập và Phân quyền truy cập (JWT Authentication)
**Là** Người dùng đã có tài khoản (KH / AD / CGNN / CVLĐ)  
**Tôi muốn** Đăng nhập vào hệ thống bằng Email và Mật khẩu  
**Để** Truy cập đúng không gian làm việc và các tính năng tương ứng với vai trò của mình  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hệ thống xác thực thông tin đăng nhập, sinh Access Token (JWT) và Refresh Token lưu trữ an toàn.
- Dựa trên Claims của Token, tự động điều hướng người dùng:
  - `ROLE_CUSTOMER` → KH Dashboard (Trang chủ Khách hàng).
  - `ROLE_ADMIN` → AD Dashboard (Quản trị hệ thống).
  - `ROLE_EXPERT` → CGNN Portal (Cổng Chuyên gia nông nghiệp).
  - `ROLE_STAFF` → CVLĐ Portal (Giao diện di động Chuyên viên lao động).
- Trả về thông báo lỗi thân thiện nếu sai mật khẩu hoặc tài khoản bị khóa (`status = INACTIVE`).

### US1.3: Quản lý hồ sơ cá nhân và Đổi mật khẩu
**Là** Người dùng hệ thống  
**Tôi muốn** Xem, cập nhật thông tin cá nhân và thay đổi mật khẩu  
**Để** Đảm bảo tính chính xác của thông tin liên lạc và bảo mật tài khoản  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Người dùng có thể cập nhật: Họ tên, Số điện thoại, Địa chỉ nhận nông sản, Ảnh đại diện (Avatar).
- Đổi mật khẩu yêu cầu nhập đúng mật khẩu hiện tại, xác nhận mật khẩu mới khớp nhau.
- Sau khi đổi mật khẩu thành công, vô hiệu hóa các token cũ và yêu cầu đăng nhập lại.

### US1.4: Quản trị tài khoản và Phân quyền vai trò (AD)
**Là** Quản trị viên (AD)  
**Tôi muốn** Quản lý danh sách người dùng, kích hoạt/khóa tài khoản và gán vai trò (Roles)  
**Để** Điều hành tổ chức, chỉ định nhân sự chuyên môn và kiểm soát an ninh nền tảng  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị danh sách người dùng có phân trang, tìm kiếm theo tên/email và lọc theo vai trò.
- Cho phép tạo mới tài khoản nội bộ và chỉ định vai trò: `ROLE_EXPERT` hoặc `ROLE_STAFF`.
- Chức năng Khóa/Mở khóa tài khoản (Active/Locked) có ghi nhận lý do vào Audit Log.
- Không cho phép AD tự khóa chính mình hoặc tước quyền Admin tối cao cuối cùng.

---

## EPIC 2: QUẢN TRỊ TÀI NGUYÊN ĐẤT VÀ MARKETPLACE (AD)

### US2.1: Quản lý hồ sơ Khu đất (Land Management)
**Là** Quản trị viên (AD)  
**Tôi muốn** Khởi tạo, cập nhật thông tin các Khu đất (`Land`)  
**Để** Quản lý quỹ đất nông nghiệp tập trung của nền tảng  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Nhập thông tin khu đất: Tên khu đất, Địa chỉ chi tiết, Tọa độ GPS (phục vụ Weather API), Tổng diện tích (m²), Loại thổ nhưỡng chính, Nguồn nước tưới, Mô tả tiện ích, Hình ảnh tổng thể.
- Kiểm tra tính hợp lệ dữ liệu, lưu trữ vào CSDL PostgreSQL.
- Cập nhật trạng thái hoạt động của Land (Đang khai thác / Tạm dừng).

### US2.2: Phân lô và Cấu hình Plot (Plot Management & Pricing)
**Là** Quản trị viên (AD)  
**Tôi muốn** Chia nhỏ khu đất thành các Plot độc lập và thiết lập đơn giá thuê  
**Để** Đưa các Plot sẵn sàng lên sàn Marketplace cho KH thuê  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Thuộc tính mỗi Plot: Mã số thửa đất (ví dụ: `L01-P01`), Diện tích (m²), Đơn vị giá thuê/tháng, Vị trí trong sơ đồ vườn, Hình ảnh thực tế.
- Gắn mã thiết bị cảm biến IoT (`iot_device_code`) tương ứng phục vụ đọc dữ liệu vi khí hậu.
- Trạng thái khởi tạo mặc định: `Hidden` (chưa hiển thị trên Marketplace).
- AD bật hiển thị chuyển sang `Published` để KH có thể xem và thuê.

### US2.3: Tra cứu Danh mục Cây trồng tương thích của Plot (AD)
**Là** Quản trị viên (AD)  
**Tôi muốn** Xem danh mục các loại rau tương thích với từng Plot (do CGNN thiết lập)  
**Để** Kiểm tra tính đầy đủ của thông số kỹ thuật trước khi công bố (Publish) Plot lên sàn Marketplace  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị danh mục Crop/Variety tương thích đã được CGNN gán cho Plot (chế độ Read-only đối với AD).
- Khách hàng khi xem chi tiết Plot trên Marketplace chỉ được chọn những cây trồng nằm trong danh sách tương thích này.
- Khi cần bổ sung hoặc thay đổi tính tương thích sinh học, AD tiếp nhận khuyến nghị từ CGNN để CGNN thực hiện cập nhật tại US4.2.

### US2.4: Quản lý Danh mục Dịch vụ phát sinh (Service Management)
**Là** Quản trị viên (AD)  
**Tôi muốn** Định nghĩa và cập nhật danh mục các gói dịch vụ chăm sóc lẻ  
**Để** KH có thể đặt dịch vụ phát sinh (Service Request) khi bận đột xuất  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Danh mục gồm: Tên dịch vụ (Tưới nước, Bón phân, Làm cỏ...), Mô tả, Đơn giá niêm yết.
- AD có thể kích hoạt/tắt từng dịch vụ trên hệ thống.
- Danh mục này hiển thị cho KH khi đặt Service Request.

---

## EPIC 3: MARKETPLACE, TƯ VẤN TRƯỚC THUÊ VÀ THUÊ PLOT (KH)

### US3.1: Tìm kiếm và Lọc Plot trên Marketplace
**Là** Khách hàng (KH)  
**Tôi muốn** Tìm kiếm và lọc danh sách Plot đang mở cho thuê  
**Để** Nhanh chóng tìm được thửa đất phù hợp với nhu cầu và ngân sách  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị danh sách Plot đang có trạng thái `Published` (Listing Status).
- Bộ lọc đa tiêu chí: Theo Khu đất/Vị trí, Khoảng diện tích, Mức giá thuê, Loại rau mong muốn trồng, Khoảng thời gian khả dụng.
- Thẻ thông tin Plot hiển thị rõ: Hình ảnh đại diện, Mã thửa, Diện tích, Giá thuê/tháng, Nhóm cây phù hợp.

### US3.2: Xem chi tiết thông số kỹ thuật Plot
**Là** Khách hàng (KH)  
**Tôi muốn** Xem trang chi tiết của một Plot cụ thể  
**Để** Nắm rõ hạ tầng, nguồn nước, điều kiện kỹ thuật và IoT trước khi quyết định  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị đầy đủ: Thư viện ảnh thực tế, Thông tin thổ nhưỡng, Nguồn nước tưới, Điều kiện kỹ thuật.
- Bảng giá minh bạch: Tiền thuê theo kỳ, Chi phí gói Assisted-growing (nếu có), không yêu cầu đặt cọc.
- Hiển thị thông số môi trường hiện tại từ cảm biến IoT Mock tại Plot.
- Hiển thị dự báo thời tiết tại vị trí khu vườn.
- Hiển thị danh mục cây trồng tương thích và lịch khả dụng.

### US3.2b: Đặt lịch hẹn xem đất trực tiếp tại trang trại (Site Visit Booking)
**Là** Khách hàng (KH)  
**Tôi muốn** Đặt lịch hẹn đến trực tiếp nông trại để khảo sát hiện trạng thửa đất  
**Để** An tâm về vị trí, thổ nhưỡng và không gian thực tế trước khi bỏ tiền ký hợp đồng  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Khách hàng bấm nút "Đặt lịch xem đất" từ trang chi tiết Plot hoặc trang chủ.
- Form đặt lịch: Chọn ngày đến thăm, chọn khung giờ (Ca sáng: 08:30 - 10:30, Ca chiều: 14:30 - 16:30), số người đi cùng và ghi chú.
- Hệ thống tạo bản ghi `SiteVisit` với trạng thái `PENDING_CONFIRMATION` và gửi thông báo cho Admin/Lễ tân nông trại.
- Admin xác nhận lịch hẹn → Trạng thái chuyển `CONFIRMED`, hệ thống gửi mã QR Check-in và hướng dẫn chỉ đường cho khách hàng qua Notification/Email.
- Khách hàng có thể hủy hoặc đổi lịch hẹn trước giờ hẹn tối thiểu 04 tiếng.

### US3.3: Yêu cầu Tư vấn trước khi thuê (Pre-rental Consultation)
**Là** Khách hàng (KH)  
**Tôi muốn** Tạo phiên tư vấn hỏi CGNN về Plot, giống cây hoặc thời gian sinh trưởng phù hợp  
**Để** Được hỗ trợ chuyên môn trước khi đưa ra quyết định thuê  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- KH bấm "Hỏi Chuyên gia" từ trang chi tiết Plot hoặc từ Dashboard.
- Form nhập: Mô tả nhu cầu, câu hỏi cụ thể, tham chiếu Plot nếu có.
- Hệ thống tạo phiên tư vấn (`ConsultationTicket` loại `PRE_RENTAL`) và thông báo cho CGNN.
- CGNN tra cứu thông số Plot và đưa ra khuyến nghị (Recommendation).
- **Bước này là tùy chọn, không bắt buộc và không khóa giữ chỗ Plot (BR06).**

### US3.4: Chọn Crop/Variety, Thời gian và Hình thức canh tác
**Là** Khách hàng (KH)  
**Tôi muốn** Chọn giống rau muốn trồng và khoảng thời gian thuê  
**Để** Cá nhân hóa mô hình trải nghiệm làm vườn  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- **Bắt buộc chọn giống trong Danh mục kiểm định:** KH chỉ được chọn giống rau (Variety) nằm trong danh mục đã được Farmely kiểm định và tương thích với thổ nhưỡng của Plot (`plot_crop_compatibility`). Hệ thống từ chối việc tự ý đem giống trôi nổi bên ngoài vào vườn (BR03).
- **Bộ Starter Kit tháng đầu:** Giao diện thông báo rõ ràng cho khách hàng: *"Giá thuê tháng đầu tiên đã bao gồm trọn gói 01 bộ Starter Kit (Cây con giống F1 đã ươm sẵn + Khay giá thể hữu cơ ban đầu); khách hàng chỉ việc đến nhận tại vườn và cấy trồng"*.
- KH chọn `Start Date` và `End Date`.
- KH chọn ngay Hình thức canh tác ban đầu (Self-growing / Assisted-growing) tại bước này để hệ thống tính chi phí trọn gói (BR05, BR11).
- Hệ thống tự động kiểm tra 3 điều kiện (BR03, BR04, BR07):
  1. **Tính tương thích:** Crop phải nằm trong danh mục tương thích của Plot.
  2. **Thời lượng đủ:** End Date – Start Date ≥ Expected Duration + Buffer Time.
  3. **Chống trùng lịch:** Không trùng khoảng thời gian với Hợp đồng khác trên cùng Plot.
- Nếu không hợp lệ → Hiển thị thông báo lỗi rõ ràng.

### US3.5: Giữ chỗ tạm thời (Reservation Lock – 15 phút)
**Là** Khách hàng (KH)  
**Tôi muốn** Hệ thống tạm thời khóa giữ chỗ Plot khi tôi bấm đặt thuê  
**Để** Có đủ thời gian kiểm tra thông tin và thanh toán mà không bị tranh mất chỗ  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hệ thống tạo bản ghi `Reservation` với thời gian hiệu lực 15 phút (BR08).
- Hiển thị đồng hồ đếm ngược (Countdown Timer) 15:00 trên màn hình thanh toán.
- Nếu quá 15 phút chưa thanh toán thành công → Reservation chuyển `Expired`, giải phóng Plot.

### US3.6: Ký Hợp đồng & Thanh toán trực tiếp qua Mock Payment Gateway (100% Upfront, Không cọc)
**Là** Khách hàng (KH)  
**Tôi muốn** Ký Hợp đồng điện tử và thực hiện thanh toán tiền thuê trực tiếp cho Hợp đồng  
**Để** Kích hoạt hợp đồng thuê một cách an toàn, minh bạch và tức thì  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Màn hình thanh toán hiển thị chi tiết: Tiền thuê đất & nền tảng, Phí gói canh tác (nếu có), Chi phí Starter Kit (0đ - đã bao gồm), Tổng giá trị Hợp đồng (`total_price`).
- Thanh toán gắn trực tiếp với `contract_id`, triệt tiêu bảng Order trung gian và tránh trùng lặp tính toán amount.
- Hỗ trợ Mock Payment: "Thẻ ngân hàng mô phỏng" hoặc "Ví điện tử mô phỏng".
- Khi KH bấm chuyển hướng sang cổng thanh toán → Reservation chuyển `PAYMENT_PENDING` và được gia hạn thêm 03 phút (Grace Period) để hoàn tất xác thực OTP ngân hàng mà không bị hủy đơn (BR08).
- Khi thanh toán thành công (`Success`):
  - `Reservation` chuyển thành `Converted`.
  - Hợp đồng `Contract` được tạo ở trạng thái `Confirmed` kèm mã hợp đồng `contract_code`.
  - Thanh toán trả trước 100% tiền thuê, loại bỏ hoàn toàn quy trình đặt cọc và hoàn cọc (BR09).
- Khi đến đúng `Start Date` → Hợp đồng tự động chuyển từ `Confirmed` sang `Active` (BR09).
- Khi thất bại → Giữ nguyên trạng thái chờ thanh toán lại trong thời gian còn lại của Reservation.

### US3.7: Yêu cầu Hủy Hợp đồng và Quy trình Hoàn tiền (Cancellation Request & Refund)
**Là** Khách hàng (KH)  
**Tôi muốn** Gửi yêu cầu hủy hợp đồng thuê trước ngày bắt đầu canh tác  
**Để** Chủ động rút lui khi kế hoạch thay đổi và nhận hoàn tiền theo đúng điều khoản khấu trừ (BR10)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- KH gửi yêu cầu hủy từ màn hình chi tiết Hợp đồng (chỉ khả dụng khi Hợp đồng chưa chuyển `Active`).
- Hệ thống tạo bản ghi `CancellationRequest` ghi nhận lý do hủy của khách hàng.
- Hệ thống/Admin tự động thẩm định và áp dụng tỷ lệ khấu trừ theo điều khoản (BR10):
  - Hủy trước `Start Date` ≥ 03 ngày → Khấu trừ 20%, số tiền hoàn trả (`refund_amount`) = 80% tổng giá trị hợp đồng.
  - Hủy trước `Start Date` < 03 ngày → Khấu trừ 50%, số tiền hoàn trả (`refund_amount`) = 50%.
  - Hợp đồng đã chuyển `Active` (đã đến Start Date) → Từ chối hoàn tiền (cây giống, phân bón và chi phí chuẩn bị mặt bằng đã triển khai).
- Sau khi `CancellationRequest` được duyệt → Hệ thống tự động tạo bản ghi `PaymentTransaction` loại `REFUND` liên kết với yêu cầu hủy để chuyển khoản hoàn tiền cho khách.
- Hợp đồng chuyển sang `TERMINATED`; Thửa đất chuyển sang bảo dưỡng (`MAINTENANCE`) trước khi mở lại.

### US3.8: Gia hạn Hợp đồng (Contract Renewal)
**Là** Khách hàng (KH)  
**Tôi muốn** Gia hạn hợp đồng thuê thửa đất hiện tại trước khi hợp đồng kết thúc  
**Để** Tiếp tục chu kỳ canh tác mới mà không bị gián đoạn và không bị người khác thuê mất thửa đất  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Trước khi hợp đồng kết thúc tối thiểu 07 ngày, hệ thống hiển thị nút "Gia hạn hợp đồng (Renew)" trên Dashboard và chi tiết Hợp đồng của KH.
- KH chọn khoảng thời gian gia hạn mới (Số tháng / Chu kỳ vụ mùa mới).
- Hệ thống sinh bản ghi Hợp đồng mới với `parent_contract_id` trỏ về hợp đồng cũ, kế thừa `plot_id` và `variety_id`.
- KH thanh toán tiền thuê cho chu kỳ mới. Sau khi thanh toán thành công, Hợp đồng mới được xác nhận, hợp đồng cũ chuyển trạng thái `RENEWED` khi hết hạn; thửa đất không bị rơi vào trạng thái bảo dưỡng hay bị mở cho người khác thuê.

---

## EPIC 4: TRI THỨC NÔNG NGHIỆP VÀ QUY TRÌNH CHUẨN (CGNN)

### US4.1: Quản lý Danh mục Cây trồng và Giống cây (Crop & Variety)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Thêm, sửa thông tin các loài cây trồng (`Crop`) và giống cây (`Variety`)  
**Để** Chuẩn hóa cơ sở dữ liệu thực vật học phục vụ canh tác đô thị  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Khai báo thuộc tính: Tên giống, Tên khoa học, Nhóm rau, Thời gian sinh trưởng (ngày), Năng suất kỳ vọng/m², Mùa vụ tối ưu, Đặc tính chống chịu sâu bệnh, Hình ảnh minh họa.
- Quản lý trạng thái áp dụng (Active/Inactive) trên hệ thống.

### US4.2: Thiết lập bảng tương thích Plot–Crop Compatibility
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Quy định giống cây nào phù hợp với đặc tính thổ nhưỡng của từng Plot  
**Để** Hệ thống tự động lọc danh sách cây trồng cho KH chọn khi thuê (BR03)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Giao diện cho phép CGNN chọn Plot → gán danh sách Crop/Variety tương thích.
- Dữ liệu lưu trong bảng `PlotCropCompatibility`.
- AD có thể xem và cập nhật bổ sung dựa trên đề xuất CGNN.

### US4.3: Xây dựng Quy trình canh tác chuẩn (Standard Process Template)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Soạn thảo và quản lý Quy trình canh tác chuẩn cho từng giống rau  
**Để** Đảm bảo chất lượng canh tác đồng bộ và làm căn cứ khởi tạo Kế hoạch canh tác (Cultivation Plan)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Tạo quy trình với nhiều giai đoạn (Stages) liên hoàn:  
  Ươm hạt/Xuống giống → Phát triển cây con → Tăng trưởng & Bón thúc → Chuẩn bị thu hoạch.
- Mỗi giai đoạn định nghĩa rõ: Số ngày bắt đầu và kết thúc (Day Offset), Tần suất tưới nước (lần/ngày), Định mức lượng nước (lít/m²).
- Quản lý phiên bản quy trình (Template Version) để theo dõi lịch sử thay đổi.

### US4.4: Soạn Hướng dẫn kỹ thuật và Định mức vật tư
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Viết chỉ dẫn chi tiết về kỹ thuật bón phân, làm cỏ và phòng sâu bệnh gắn vào từng bước  
**Để** CVLĐ và KH tự trồng có cẩm nang hướng dẫn thao tác chuẩn xác  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Soạn thảo hướng dẫn định dạng Rich Text/Markdown.
- Khai báo danh mục vật tư khuyến nghị (ví dụ: Phân trùn quế: 0.5kg/m², Chế phẩm sinh học: 10ml/bình).
- Hướng dẫn triệu chứng bất thường thường gặp ở giai đoạn đó và cách xử lý tức thời.

### US4.5: Cấu hình Ngưỡng an toàn môi trường IoT theo giai đoạn
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Thiết lập ngưỡng min/max cho nhiệt độ, độ ẩm không khí và độ ẩm đất cho từng giai đoạn  
**Để** Hệ thống IoT tự động so sánh dữ liệu cảm biến và phát cảnh báo kịp thời  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Cấu hình cho từng Stage:
  - `min_temp`, `max_temp` (°C).
  - `min_air_humidity`, `max_air_humidity` (%).
  - `min_soil_moisture`, `max_soil_moisture` (%).
- Dữ liệu được lưu trong cấu hình giai đoạn và dùng làm căn cứ kích hoạt `EnvironmentalAlert`.

### US4.6: Quản lý kho tài liệu chuyên môn (cho AI Service)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Cập nhật thư viện tài liệu kỹ thuật chuyên môn  
**Để** Làm cơ sở dữ liệu đầu vào cho AI Chatbot và tra cứu kỹ thuật nông nghiệp  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Upload, phân loại và quản lý tài liệu chuyên môn (`ProfessionalSourceDocument`).
- Tài liệu được phân loại theo chủ đề: Kỹ thuật trồng, Phòng trừ sâu bệnh, Dinh dưỡng đất...
- AI Service tham chiếu thư viện này khi trả lời Chatbot tư vấn cho khách hàng.

---

## EPIC 5: KÍCH HOẠT QUY TRÌNH CANH TÁC CHUẨN VÀ 2 NHÁNH TRẢI NGHIỆM (KH & CGNN)

### US5.1: Xem và Khởi động luồng chăm sóc theo hình thức canh tác đã chọn
**Là** Khách hàng (KH)  
**Tôi muốn** Xem lại hình thức canh tác đã chọn khi ký hợp đồng và quyền lợi tương ứng  
**Để** Nắm rõ mô hình trải nghiệm của mình trong suốt kỳ thuê (BR11)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hình thức canh tác được KH lựa chọn ngay tại bước giữ chỗ (US3.4) và gắn cố định vào Hợp đồng (BR05).
- Hai nhánh trải nghiệm rõ rệt:
  - **Self-growing (Tự canh tác):** KH tự đến vườn chăm sóc, tự ghi Farm Diary, đăng ảnh. Hệ thống không tự động sinh Care Task; KH được cấp quyền xem Quy trình canh tác chuẩn (Read-only). Khi bận đột xuất → đặt dịch vụ lẻ hoặc mua Gói ủy thác chăm sóc trọn gói 30 ngày (US7.5).
  - **Assisted-growing (Ủy thác trọn gói):** Hệ thống tự động kích hoạt Quy trình canh tác chuẩn và sinh Care Task tự động theo từng mốc sinh trưởng của giống cây.
- 1 Hợp đồng gắn cố định với 1 Cultivation Mode. Muốn đổi → tạo lượt thuê mới (BR05, BR11).

### US5.2: Tự động kích hoạt Quy trình canh tác chuẩn của giống cây (Assisted-growing)
**Là** Hệ thống / Khách hàng (KH)  
**Tôi muốn** Hệ thống tự động áp dụng Quy trình canh tác chuẩn của giống cây và tự động sinh danh mục công việc  
**Để** Đảm bảo tính khoa học nông học đồng bộ, không phát sinh sai lệch do may đo cá nhân (BR12)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Ngay khi Hợp đồng Assisted-growing chuyển sang `Active` (vào ngày `Start Date`), hệ thống tự động đọc danh mục các bước (`template_steps`) trong Quy trình chuẩn của giống cây.
- Với mỗi bước, hệ thống tính toán ngày thực hiện: `due_date = contract.start_date + template_steps.day_offset`.
- Hệ thống tự động sinh bản ghi `CareTask` ở trạng thái `SCHEDULED` liên kết trực tiếp với `template_step_id`.
- Loại bỏ hoàn toàn quy trình may đo (customize) kế hoạch riêng lẻ cho từng khách và không tạo các phiên bản `Plan Versions` rườm rà (BR12).
- AD và CVLĐ phụ trách khu đất nhận thông báo về danh mục công việc định kỳ cần thực hiện.

### US5.3: CGNN Điều chỉnh chỉ dẫn kỹ thuật diện rộng khi có biến động (System-wide Process Adjustment)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Bổ sung hướng dẫn xử lý hoặc thêm bước can thiệp trên Quy trình chuẩn của giống cây khi thời tiết hoặc dịch bệnh biến động  
**Để** Áp dụng đồng bộ cho toàn bộ các thửa đất đang trồng giống rau đó (BR13)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- CGNN truy cập Quy trình chuẩn của giống cây (`process_templates`) và bổ sung chỉ dẫn hoặc bước can thiệp khẩn cấp.
- Hệ thống áp dụng đồng bộ cho các `care_tasks` sắp tới của các thửa đất cùng loại cây đang canh tác.
- Lịch sử điều chỉnh kỹ thuật được lưu vết tập trung theo Giống cây, không lưu rải rác theo từng hợp đồng khách hàng.

---

## EPIC 6: ĐIỀU PHỐI VÀ THỰC THI CARE TASK (AD & CVLĐ)

### US6.1: AD Phân công Care Task hằng ngày cho CVLĐ
**Là** Quản trị viên (AD)  
**Tôi muốn** Phân bổ các Care Task trong ngày cho CVLĐ phụ trách khu đất tương ứng  
**Để** Tối ưu nhân lực và đảm bảo không có Plot nào bị bỏ quên  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Màn hình lịch công việc hiển thị các task chưa gán người phụ trách (`assigned_staff_id IS NULL`).
- AD chọn CVLĐ từ danh sách nhân viên đang trực ca tại khu đất đó.
- Task chuyển từ `Pending` sang `Assigned`.
- CVLĐ nhận được thông báo về công việc mới được phân công.

### US6.2: AD Tiếp nhận và Phân công Service Request
**Là** Quản trị viên (AD)  
**Tôi muốn** Xem các yêu cầu dịch vụ phát sinh từ KH và phân công CVLĐ thực hiện  
**Để** Đảm bảo dịch vụ chăm sóc lẻ được thực hiện kịp thời  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Danh sách Service Request mới ở trạng thái `PENDING` (chờ Admin review) từ KH (BR27).
- AD xem chi tiết yêu cầu, kiểm tra tính khả thi, ước tính chi phí và gửi báo giá cho KH → Request chuyển `QUOTED`.
- Sau khi KH duyệt và thanh toán (`APPROVED`), AD phân công CVLĐ phù hợp.
- Hệ thống tạo Care Task tương ứng và gán cho CVLĐ được chọn.

### US6.3: CVLĐ Tiếp nhận và Xem danh sách công việc hằng ngày
**Là** Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Mở giao diện di động xem danh sách các Care Task cần làm trong ngày  
**Để** Nắm rõ nhiệm vụ, vị trí Plot và kế hoạch di chuyển  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Giao diện thân thiện di động hiển thị task hôm nay, gom nhóm theo Plot / Khu đất.
- Xem chi tiết từng task: Tên công việc, Hướng dẫn kỹ thuật từ Standard Process, Định mức vật tư cần mang theo.
- Xem vị trí Plot và loại cây trồng trên Plot đó.
- Nút bấm "Bắt đầu làm" chuyển trạng thái sang `IN_PROGRESS`.

### US6.4: CVLĐ Thực thi Task – Ghi nhận Vật tư và Chụp ảnh minh chứng
**Là** Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Khai báo vật tư đã sử dụng và chụp ảnh thành quả sau khi chăm sóc  
**Để** Cung cấp bằng chứng thực tế minh bạch cho KH và quản lý (BR15)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Form hoàn thành task yêu cầu:
  - Nhập khối lượng vật tư đã dùng (`Material Usage`): Tên vật tư, Số lượng, Đơn vị (BR16).
  - **Bắt buộc tải lên ít nhất 1 ảnh thực tế chụp tại Plot** (`TaskEvidence`) (BR15).
  - Ghi chú hiện trạng cây (nếu phát hiện bất thường).
- Không cho phép hoàn thành task nếu thiếu ảnh chụp minh chứng.

### US6.5: CVLĐ Xác nhận hoàn thành Task và Tự động Đồng bộ Farm Diary
**Là** Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Nhấn xác nhận hoàn thành công việc  
**Để** Đóng task và tự động cập nhật kết quả vào Farm Diary của KH (BR17)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Chuyển trạng thái task sang `COMPLETED`, lưu thời điểm hoàn tất thực tế (`actual_date`).
- Sau 23:59 ngày thực hiện mà task chưa `COMPLETED` → hệ thống tự động chuyển `OVERDUE` và thông báo cho AD điều phối nhân sự xử lý bù vào ca sáng hôm sau (BR14).
- Hệ thống tự động tạo bản ghi tương ứng trong `FarmDiary` của Plot/Rental đó với nội dung công việc và ảnh.
- Gửi thông báo (In-app Notification) cho KH rằng mảnh vườn vừa được chăm sóc xong.

### US6.6: CVLĐ Tạo Issue Report và Chat với CGNN
**Là** Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Báo cáo sự cố bất thường tại vườn và chat với CGNN để xin hướng dẫn kỹ thuật  
**Để** Kịp thời xử lý tình trạng sâu bệnh hoặc hỏng hóc theo đúng chuyên môn  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- CVLĐ bấm "Báo cáo sự cố" → Tạo `Issue Report` kèm mô tả và ảnh chụp.
- Issue Report gửi thông báo cho CGNN.
- CVLĐ có thể chat trực tiếp với CGNN qua kênh riêng biệt (CVLĐ ↔ CGNN) để nhận hướng dẫn xử lý.
- CGNN phản hồi biện pháp kỹ thuật hoặc đề xuất Plan Revision nếu cần.

---

## EPIC 7: FARM DIARY, GIÁM SÁT IOT VÀ THỜI TIẾT

### US7.1: Theo dõi Tiến độ Chu kỳ canh tác (Customer Dashboard)
**Là** Khách hàng (KH)  
**Tôi muốn** Theo dõi thanh tiến trình tổng thể chu kỳ sinh trưởng của mảnh vườn  
**Để** Biết cây đang ở giai đoạn nào và bao nhiêu ngày nữa thu hoạch  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị thanh tiến trình trực quan (% hoàn thành, ngày hiện tại / tổng số ngày chu kỳ).
- Thẻ thông tin giai đoạn sinh trưởng hiện tại kèm chỉ dẫn chăm sóc.
- Lịch trình các mốc phát triển quan trọng tiếp theo.

### US7.2: Xem Nhật ký nông trại điện tử (Farm Diary Timeline)
**Là** Khách hàng (KH)  
**Tôi muốn** Xem dòng thời gian nhật ký nông trại của Plot mình thuê  
**Để** Cảm nhận sự phát triển hằng ngày của luống rau và an tâm về độ minh bạch  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Danh sách bài viết nhật ký sắp xếp theo thời gian mới nhất.
- Mỗi bài gồm: Thời gian, Người ghi (CVLĐ hay KH), Nội dung, Vật tư sử dụng, Ảnh chụp.
- Cho phép KH phóng to ảnh để xem chi tiết.
- Dữ liệu tự động từ CVLĐ hoàn thành task (BR17) xen kẽ với bài viết tự tạo của KH.

### US7.3: KH Tự tạo bài viết nhật ký (Self-growing)
**Là** Khách hàng tự trồng (Self-growing)  
**Tôi muốn** Tự chụp ảnh, đo chiều cao cây và viết nhật ký mỗi khi đến chăm sóc vườn  
**Để** Lưu giữ kỷ niệm và theo dõi hiệu quả canh tác  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Nút "Tạo nhật ký mới" trên Dashboard.
- Form cho phép: Tải ảnh, Nhập chiều cao cây (cm), Đánh giá sức khỏe cây (Tốt/Bình thường/Sâu hại), Ghi chép nội dung.
- Bài đăng lưu vào `FarmDiary` và hiển thị trên Timeline chung.

### US7.4: Giám sát chỉ số IoT Mock và Biểu đồ vi khí hậu
**Là** Khách hàng (KH) hoặc CGNN  
**Tôi muốn** Xem số đo nhiệt độ, độ ẩm không khí và độ ẩm đất hiện tại ở Plot  
**Để** Nắm bắt điều kiện vi khí hậu trực tiếp tại nơi rau đang sinh trưởng  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hiển thị 3 đồng hồ đo thời gian thực: Nhiệt độ (°C), Ẩm không khí (%), Ẩm đất (%).
- Trạng thái đánh giá màu sắc: Xanh (Lý tưởng), Vàng (Cận ngưỡng), Đỏ (Nguy hiểm).
- Biểu đồ đường lịch sử (Recharts): 24 giờ qua / 7 ngày qua.
- Đường vẽ ngưỡng an toàn (min/max) để đối chiếu trực quan.
- Hiển thị thời điểm đo gần nhất (mô phỏng chu kỳ 3 giờ/lần).

### US7.5: Đặt Dịch vụ chăm sóc phát sinh & Gói ủy thác theo tháng (Service Request)
**Là** Khách hàng (KH, đặc biệt Self-growing)  
**Tôi muốn** Đặt riêng lẻ từng dịch vụ chăm sóc (Tưới nước, Bón phân, Làm cỏ...) hoặc mua Gói ủy thác chăm sóc trọn gói 30 ngày  
**Để** Nhờ CVLĐ hỗ trợ chăm sóc vườn trong những đợt bận đột xuất, tránh tình trạng vườn rau bị hư hại (BR27)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Danh mục dịch vụ gồm 2 nhóm chính:
  1. **Dịch vụ lẻ theo lượt (A-la-carte):** Tưới nước bổ sung, Phun chế phẩm sinh học phòng trừ sâu bệnh, Làm cỏ bón phân theo lượt.
  2. **Gói ủy thác chăm sóc trọn gói 30 ngày (Temporary Full-care Month Pass):** Cho phép khách hàng đang tự canh tác (Self-growing) nhưng bận đi công tác xa ủy thác toàn quyền chăm sóc trong 30 ngày.
- **Cơ chế tự động sinh Care Task khi mua Gói ủy thác 30 ngày:**
  - Hệ thống tự động quét các bước trong `template_steps` của giống cây tương ứng với giai đoạn 30 ngày đó.
  - Tự động sinh danh sách các `CareTask` tương ứng và gán cho CVLĐ quản lý khu vườn.
- KH chọn dịch vụ/gói ủy thác, chọn ngày bắt đầu, điền ghi chú → thanh toán qua Mock Payment Gateway.
- Ngay sau khi thanh toán thành công, hệ thống tự động sinh Task và gửi thông báo cho CVLĐ; khi CVLĐ hoàn thành Task sẽ chụp ảnh bằng chứng và đồng bộ vào Farm Diary của khách hàng.

### US7.6: Xem Dự báo thời tiết địa phương
**Là** Khách hàng (KH) và CVLĐ  
**Tôi muốn** Xem thời tiết hôm nay và dự báo 3-5 ngày tới tại vị trí khu vườn  
**Để** Chủ động kế hoạch tưới nước hoặc che chắn giàn  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Tích hợp Weather API dựa trên tọa độ GPS của `Land`.
- Hiển thị biểu tượng thời tiết, Nhiệt độ, Tốc độ gió, Xác suất mưa.
- Bảng dự báo ngắn hạn các ngày tiếp theo.

### US7.7: Nhận Thông báo cảnh báo môi trường vượt ngưỡng (Alerts)
**Là** Khách hàng (KH) và CVLĐ  
**Tôi muốn** Nhận thông báo tức thì khi chỉ số môi trường vượt ngưỡng an toàn  
**Để** Kịp thời can thiệp (ví dụ: tưới thêm khi đất quá khô)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Khi dữ liệu IoT vượt ngưỡng min/max của giai đoạn kéo dài (quá 30 phút) → sinh `EnvironmentalAlert` (BR18).
- Assisted-growing – trong giờ hành chính (8:00–17:00): hệ thống tự động sinh Emergency Care Task (tưới bù ẩm) giao cho CVLĐ trực ca.
- Assisted-growing – ngoài giờ hành chính: hệ thống gửi SMS/Push notification cho Admin và ghi log để xử lý vào sáng hôm sau.
- Self-growing: hệ thống đẩy thông báo khẩn cấp kèm nút "Tạo yêu cầu cứu hộ nhanh" (Quick Service Request – tính phí theo bảng giá dịch vụ).
- Nội dung thông báo rõ ràng:  
  *"Cảnh báo: Độ ẩm đất tại Plot L01-P01 đang ở mức 32% (dưới ngưỡng tối thiểu 50%). Cần tưới bổ sung!"*
- Khi Weather dự báo mưa lớn hoặc độ ẩm đất đạt ngưỡng bão hòa (≥ 80%) → hệ thống tự động tạm hoãn các Care Task tưới nước trong ngày để chống ngập úng cây trồng (BR18).

---

## EPIC 8: TƯ VẤN CHUYÊN GIA, KÊNH CHAT VÀ AI CHATBOT

### US8.1: KH Gửi yêu cầu tư vấn sâu bệnh kèm ảnh cho CGNN
**Là** Khách hàng (KH)  
**Tôi muốn** Tạo phiên tư vấn, gửi ảnh cận cảnh lá/thân cây bị sâu bệnh  
**Để** Nhận chẩn đoán chính xác từ CGNN  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- KH bấm "Hỏi Chuyên gia", chọn Plot đang gặp vấn đề.
- Form nhập: Tiêu đề, Mô tả triệu chứng, Tải tối đa 3 ảnh cận cảnh.
- Hệ thống tạo `ConsultationTicket` trạng thái `OPEN` và thông báo cho CGNN.
- **KH không trực tiếp chỉ đạo CVLĐ** – mọi yêu cầu chuyên môn gửi qua CGNN (BR25).

### US8.2: CGNN Tiếp nhận tư vấn và Chat 1-1 với KH (KH ↔ CGNN)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Xem hồ sơ Plot, lịch sử chăm sóc, chỉ số IoT và chat trực tiếp với KH  
**Để** Đưa ra phác đồ hướng dẫn xử lý chính xác  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- CGNN bấm "Nhận tư vấn" → Ticket chuyển `IN_PROGRESS`, gán `expert_id`.
- Màn hình chat song song: Lịch sử tin nhắn + Panel thông số Plot (giống rau, ngày trồng, IoT 3 ngày qua, Farm Diary).
- Hỗ trợ gửi tin nhắn văn bản và hình ảnh.
- Khi giải quyết xong → "Đóng phiên tư vấn" (`CLOSED`).

### US8.3: CGNN Tiếp nhận Issue Report từ CVLĐ và Chat kỹ thuật (CVLĐ ↔ CGNN)
**Là** Chuyên gia nông nghiệp (CGNN)  
**Tôi muốn** Xem báo cáo sự cố từ CVLĐ và trao đổi kỹ thuật trực tiếp  
**Để** Hướng dẫn biện pháp xử lý sâu bệnh/hỏng hóc tại hiện trường  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- CGNN nhận thông báo khi có Issue Report mới từ CVLĐ.
- Giao diện chat riêng biệt (kênh CVLĐ ↔ CGNN) kèm ảnh sự cố và thông tin Plot.
- CGNN phản hồi biện pháp xử lý hoặc đề xuất Plan Revision (US5.5) nếu cần.

### US8.4: KH Trò chuyện với AI Chatbot (24/7)
**Là** Khách hàng (KH)  
**Tôi muốn** Trò chuyện với AI Chatbot tích hợp trên website  
**Để** Nhận câu trả lời tức thì 24/7 về kiến thức làm vườn thường thức  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Cửa sổ chat AI dạng Floating Widget ở góc màn hình, luôn khả dụng.
- AI Chatbot phản hồi tự nhiên, súc tích bằng tiếng Việt dựa trên thư viện tài liệu chuyên môn.
- Hiển thị lưu ý: *"Thông tin do AI đề xuất mang tính tham khảo. Hãy liên hệ CGNN khi cần chẩn đoán chính xác."*
- **AI chỉ hỗ trợ hỏi đáp, không tự phê duyệt hay thay đổi kế hoạch canh tác.**

---

## EPIC 9: THU HOẠCH, KẾT THÚC HỢP ĐỒNG VÀ BÁO CÁO VẬN HÀNH

### US9.1: Thông báo và Hỗ trợ Thu hoạch nông sản
**Là** Khách hàng (KH) và Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Nhận thông báo khi rau đến kỳ thu hoạch, ghi nhận sản lượng thực tế và lựa chọn phương thức nhận nông sản  
**Để** Tận hưởng thành quả canh tác trọn vẹn và minh bạch (BR20, BR21)  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Khi chu kỳ đạt mốc ngày thu hoạch → hệ thống gửi thông báo cho KH: *"Vườn rau tại Plot đã sẵn sàng thu hoạch!"*.
- **Trách nhiệm nhập dữ liệu thu hoạch (CVLĐ):** CVLĐ thực hiện thu hoạch, đem sọt rau lên bàn cân điện tử tại kho nông trại, chụp ảnh sọt rau kèm màn hình cân, và nhập số kg thực tế (`yield_amount`) vào `HarvestResult`.
- **Phương thức nhận nông sản:**
  1. *Tự đến thu hoạch hoặc nhận tại vườn vào cuối tuần (Farm Pickup):* Hoàn toàn MIỄN PHÍ.
  2. *Giao tận nhà (Home Delivery):* Khách hàng nhập địa chỉ nhận hàng; nông trại đóng thùng gửi đối tác giao hàng; cước phí vận chuyển tính thêm qua cổng thanh toán hoặc COD.
- **Nghiệm thu nông sản:** Khách hàng kiểm tra sản lượng và bấm nút "Xác nhận nhận hàng" (Nghiệm thu) trên ứng dụng, kèm đánh giá chất lượng (1-5 sao).

### US9.2: Hoàn thành Hợp đồng và Chuyển giao dữ liệu lịch sử
**Là** Khách hàng (KH)  
**Tôi muốn** Hoàn tất hợp đồng thuê và xem lại toàn bộ nhật ký canh tác  
**Để** Lưu giữ hồ sơ nông sản sạch đã sản xuất  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Khi đến `End Date` mà KH không gia hạn (Renew) → Hợp đồng chuyển sang `Completed`, toàn bộ dữ liệu chuyển chế độ chỉ đọc (BR22).
- KH truy cập "Lịch sử canh tác" ở chế độ **Chỉ đọc (Read-Only)**: Farm Diary, ảnh thu hoạch, biểu đồ IoT.
- KH không thể xem dữ liệu của người thuê mới tiếp theo trên Plot đó.
- **Vòng đời đất & Bảo dưỡng bắt buộc (BR23):** Sau khi Hợp đồng kết thúc mà không gia hạn, thửa đất tự động chuyển sang trạng thái `MAINTENANCE` đúng 04 ngày liên tục để CVLĐ dọn tàn dư rễ mục, xới đất và phơi ải diệt mầm bệnh. Sau đúng 4 ngày, hệ thống mới tự động mở lại trạng thái `AVAILABLE` cho lượt thuê mới.

### US9.3: Xem lịch sử công việc đã thực hiện (CVLĐ)
**Là** Chuyên viên lao động (CVLĐ)  
**Tôi muốn** Tra cứu lại các task mình đã hoàn thành  
**Để** Phục vụ chấm công, đánh giá hiệu suất  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Danh sách task đã `COMPLETED` gom nhóm theo Plot, thời gian.
- Hiển thị chi tiết: Tên task, Ngày thực hiện, Vật tư đã dùng, Ảnh minh chứng.

### US9.4: Báo cáo thống kê hiệu suất vận hành (AD)
**Là** Quản trị viên (AD)  
**Tôi muốn** Xem bảng số liệu thống kê tổng hợp của nền tảng  
**Để** Đánh giá hiệu quả kinh doanh và tình hình khai thác tài nguyên đất  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Biểu đồ và thẻ KPI:
  - Tỷ lệ lấp đầy đất: Số Plot đang thuê / Tổng số Plot (%).
  - Doanh thu tiền thuê và doanh thu dịch vụ chăm sóc trong tháng.
  - Tỷ lệ lựa chọn: Self-growing vs Assisted-growing.
  - Số lượng task hoàn thành đúng hạn của CVLĐ.
  - Số phiên tư vấn CGNN đã giải quyết thành công.

### US9.5: Tra cứu Nhật ký kiểm toán hệ thống (Audit Log)
**Là** Quản trị viên (AD)  
**Tôi muốn** Tra cứu nhật ký thao tác nghiệp vụ và sự kiện an ninh  
**Để** Truy vết lỗi, kiểm tra và nâng cao tính minh bạch  

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Ghi nhận tự động: Đăng nhập thất bại, Thay đổi quyền, Chuyển trạng thái Plot/Rental, Giao dịch thanh toán.
- Bảng nhật ký: Thời gian, User, IP, Hành động, Thực thể bị tác động, Mô tả.
- Bộ lọc theo thời gian, User và loại hành vi.

---

## PHỤ LỤC: MA TRẬN PHÂN QUYỀN VÀ BUSINESS RULES

### 1. Ma trận Phân quyền (RBAC Matrix)

| Chức Năng Cốt Lõi | KH (Khách hàng) | AD (Administrator) | CGNN (Chuyên gia NN) | CVLĐ (Chuyên viên LĐ) |
| :--- | :---: | :---: | :---: | :---: |
| **Quản lý Tài khoản & RBAC** | Chỉ tài khoản cá nhân | Toàn quyền (CRUD + Gán Role) | Chỉ tài khoản cá nhân | Chỉ tài khoản cá nhân |
| **Quản lý Land & Plot** | Chỉ xem (Marketplace) | Toàn quyền cấu hình | Xem thông tin Plot | Xem Plot được phân công |
| **Quản lý Crop/Variety & Tương thích** | Chỉ xem khi chọn thuê | Quản lý danh mục (theo đề xuất CGNN) | Toàn quyền xây dựng & thiết lập tương thích | Chỉ xem hướng dẫn |
| **Standard Process Template & Ngưỡng IoT** | Không có quyền | Xem | Toàn quyền soạn thảo & cấu hình | Chỉ xem để thực thi |
| **Tư vấn trước thuê (Pre-rental)** | Gửi yêu cầu tư vấn | Giám sát | Tiếp nhận & phản hồi | Không có quyền |
| **Thuê Plot & Thanh toán** | Thực hiện giao dịch (tự phục vụ) | Giám sát & Đối soát | Không có quyền | Không có quyền |
| **Cultivation Plan** | Phê duyệt (Approve) | Giám sát | Lập & Hiệu chỉnh + Đề xuất Revision | Không có quyền |
| **Phân công Care Task** | Không có quyền | Toàn quyền phân công | Đề xuất task can thiệp (qua Plan Revision) | Xem task của bản thân |
| **Thực thi Task, Ảnh & Vật tư** | Chỉ áp dụng Self-grow | Giám sát | Xem kết quả thực địa | Thực thi chính & Ký đóng task |
| **Farm Diary** | Tự tạo (Self-grow) / Xem (Assisted) | Xem toàn bộ | Xem phục vụ tư vấn | Tự động đồng bộ từ task |
| **Giám sát IoT & Cảnh báo** | Xem Plot của mình | Xem toàn bộ hệ thống | Xem toàn bộ hệ thống | Xem Plot phụ trách |
| **Chat tư vấn KH ↔ CGNN** | Gửi câu hỏi & chat | Giám sát ticket | Trực tiếp phản hồi & giải đáp | Không trực tiếp |
| **Chat kỹ thuật CVLĐ ↔ CGNN** | Không có quyền | Giám sát | Trực tiếp phản hồi | Gửi Issue Report & chat |
| **Service Request (Dịch vụ lẻ)** | Đặt dịch vụ & thanh toán | Tiếp nhận & phân công CVLĐ | Không có quyền | Thực hiện khi được phân công |
| **AI Chatbot** | Được sử dụng | Được sử dụng | Được sử dụng | Được sử dụng |
| **Audit Log** | Không có quyền | Toàn quyền tra cứu | Không có quyền | Không có quyền |

### 2. Tóm tắt Business Rules cốt lõi (Đồng bộ research-proposal.md v2.1)

- **BR01 – Quyền sở hữu và vận hành trang trại:** Nền tảng trực tiếp sở hữu và vận hành khu trang trại; Plot được quy hoạch, cấu hình sẵn trước khi công bố; không hỗ trợ mô hình C2C/chủ đất ngoài.
- **BR02 – Đơn vị Plot:** Plot là đơn vị đất canh tác nhỏ nhất được quản lý (vị trí, diện tích, điều kiện kỹ thuật, lịch khả dụng, danh mục Crop/Variety tương thích, dữ liệu IoT).
- **BR03 – Tính tương thích cây trồng:** KH chỉ được chọn Crop/Variety nằm trong danh mục tương thích với Plot (do CGNN cấu hình).
- **BR04 – Thời gian thuê tối thiểu:** Thời gian thuê ≥ thời gian sinh trưởng dự kiến của Variety + Buffer Time.
- **BR05 – Một Rental – một Crop/Variety – một Cultivation Mode:** Mỗi Rental chỉ gắn một Plot, một Crop/Variety, một khoảng thời gian và một hình thức canh tác (Self/Assisted) xác định ngay khi đặt chỗ.
- **BR06 – Tư vấn trước khi thuê (tùy chọn):** Pre-rental Consultation không bắt buộc để tạo Reservation.
- **BR07 – Reservation và chống trùng lịch:** Kiểm tra tương thích, thời lượng và khả dụng trước khi tạo Reservation; một Plot không có hai Rental trùng thời gian.
- **BR08 – Thời hạn Reservation và Grace Period:** Reservation hiệu lực 15 phút; khi chuyển sang cổng thanh toán được gia hạn thêm 03 phút (PAYMENT_PENDING). Quá hạn → tự động Expired, mở lại Plot.
- **BR09 – Thanh toán và xác nhận Rental:** Thanh toán trọn gói 100% qua Payment Gateway (không cọc) → Reservation Converted → Rental Confirmed → tự động Active khi đến Start Date.
- **BR10 – Hủy Rental và Chính sách Hoàn tiền:** Hủy trước Start Date ≥ 03 ngày: hoàn 80%; < 03 ngày: hoàn 50%; đã Active: không hoàn.
- **BR11 – Hai hình thức canh tác:** Self-growing (KH tự chăm sóc, xem quy trình chuẩn Read-only) và Assisted-growing (dịch vụ chăm sóc trọn gói).
- **BR12 – Phê duyệt Cultivation Plan và Auto-Approve:** CGNN lập kế hoạch; KH có 48 giờ (hoặc trước 00:00 ngày Start Date) để duyệt; quá hạn → hệ thống tự động kích hoạt kế hoạch chuẩn mặc định.
- **BR13 – Phiên bản Cultivation Plan:** Mọi thay đổi kế hoạch đã duyệt phải tạo Plan Version mới, được CGNN review và KH phê duyệt trước khi áp dụng.
- **BR14 – Phân công và thực hiện Care Task:** Task chỉ giao cho CVLĐ qua hệ thống; sau 23:59 ngày thực hiện chưa Completed → tự động Overdue để Admin điều phối xử lý bù.
- **BR15 – Minh chứng hoàn thành Task:** Mỗi Care Task phải có ít nhất 01 ảnh chụp thực tế tại Plot trước khi chuyển Completed.
- **BR16 – Material Usage:** CVLĐ phải ghi nhận vật tư đã dùng theo định mức trong Standard Process Template; phát sinh bất thường phải ghi nhận để xử lý.
- **BR17 – Đồng bộ Farm Diary:** Task Completed → thông tin thực hiện, hình ảnh và vật tư tự động ghi vào Farm Diary của Rental.
- **BR18 – Xử lý dữ liệu IoT, Thời tiết và Cảnh báo hành động:** Bất thường vượt ngưỡng kéo dài (quá 30 phút): Assisted → Emergency Care Task (giờ hành chính) hoặc SMS/Push cho Admin (ngoài giờ); Self → thông báo khẩn kèm nút Quick Service Request; mưa lớn/ẩm đất ≥ 80% → tạm hoãn task tưới.
- **BR19 – AI chatbot assistant:** AI chỉ hỗ trợ tra cứu/hỏi đáp kiến thức chung do CGNN cung cấp; vấn đề kỹ thuật đặc thù phải chuyển CGNN.
- **BR20 – Thu hoạch:** Harvest Result ghi nhận tối thiểu ngày thu hoạch, hình ảnh, sản lượng và phải được xác nhận bởi người có thẩm quyền.
- **BR21 – Quyền quyết định sản lượng:** Sản lượng thuộc Rental của KH; KH quyết định hình thức xử lý (nhận, bán, tặng).
- **BR22 – Kết thúc Rental:** Đến End Date → Rental Completed; dữ liệu chuyển chế độ chỉ đọc.
- **BR23 – Giải phóng Plot:** Plot chỉ sẵn sàng cho lượt thuê mới sau khi Rental kết thúc và công tác hậu thu hoạch (dọn dẹp, cải tạo đất) của trang trại hoàn tất.
- **BR24 – Phân quyền dữ liệu:** CGNN chỉ truy cập Rental/Plot trong phạm vi phân công; CVLĐ chỉ truy cập Care Task và Plot cần thiết cho công việc được giao.
- **BR25 – Kênh giao tiếp:** KH trao đổi trực tiếp với CGNN; CVLĐ báo Issue và chat kỹ thuật với CGNN; KH không trực tiếp phân công/chỉ đạo CVLĐ.
- **BR26 – Dữ liệu và chứng nhận:** Dữ liệu IoT, AI, Farm Diary, hình ảnh, Harvest Result chỉ phục vụ theo dõi, minh bạch; không thay thế chứng nhận pháp lý an toàn thực phẩm/hữu cơ.
- **BR27 – Service Request (Dịch vụ phát sinh):** Quy trình: KH tạo yêu cầu → Admin review & báo giá → KH phê duyệt & thanh toán (hoặc từ chối) → Admin tạo Care Task phát sinh → CVLĐ thực hiện → đồng bộ Farm Diary. Trạng thái: PENDING → QUOTED → APPROVED/REJECTED → COMPLETED.
