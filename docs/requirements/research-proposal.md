# **TỔNG QUAN DỰ ÁN – NỀN TẢNG THUÊ PLOT VÀ THEO DÕI TRẢI NGHIỆM CANH TÁC**

**Môn học:** ISP 392 – Information System Programming Project  
**Phiên bản:** 2.1

# **1\. BỐI CẢNH**

Nghiên cứu dân tộc học của Nora Katharina Faltmann về làm vườn đô thị tại Thành phố Hồ Chí Minh cho thấy một động lực đáng chú ý của người tham gia là mong muốn biết thực phẩm được trồng ở đâu, bởi ai và bằng phương pháp nào, đặc biệt trong bối cảnh người dùng thiếu niềm tin vào các nguồn thực phẩm khó kiểm chứng.

Việc tự trồng hoặc trực tiếp theo dõi quá trình trồng giúp người tham gia có cảm giác kiểm soát tốt hơn đối với quá trình sản xuất thực phẩm. Nghiên cứu cũng mô tả các mô hình vườn thương mại cho thuê từng khu vực trồng rau và cung cấp các dịch vụ chăm sóc bổ sung.

Tuy nhiên, việc tự canh tác phụ thuộc vào nhiều yếu tố như quỹ đất, thời gian, kinh nghiệm, tài chính và khả năng tiếp cận nguồn lực. Từ đó, dự án tập trung vào nhóm người dùng muốn trải nghiệm hoặc trực tiếp theo dõi quá trình trồng rau nhưng không sở hữu khu đất phù hợp, thiếu kinh nghiệm hoặc không có đủ thời gian để thực hiện toàn bộ quá trình chăm sóc.

Trong phạm vi đề án, nền tảng được định vị là đơn vị trực tiếp sở hữu và vận hành khu nông trại. Khu đất đã được quy hoạch, cải tạo sẵn và chia thành các thửa đất nhỏ (Plot) hoàn chỉnh trước khi đưa lên hệ thống.

Mỗi Plot được cấu hình sẵn các thông tin như:

* Vị trí  
* Diện tích  
* Hình ảnh thực tế  
* Giá thuê  
* Lịch khả dụng  
* Nguồn nước và điều kiện kỹ thuật  
* Dữ liệu trạm IoT  
* Danh mục Crop/Variety phù hợp

Do hệ thống đóng vai trò là chủ sở hữu quỹ đất, dự án không xử lý nghiệp vụ Chủ đất ngoài đăng tin (C2C) hay chia sẻ doanh thu hoa hồng. Khách hàng truy cập Marketplace, xem Plot, lựa chọn Crop/Variety, chọn khoảng thời gian thuê, lựa chọn hình thức canh tác và thực hiện thanh toán trọn gói 100% để kích hoạt Rental.

Trước khi thuê, nếu chưa chắc chắn về Plot, giống rau hoặc thời gian sinh trưởng phù hợp, khách hàng có thể chủ động yêu cầu tư vấn từ Chuyên gia nông nghiệp (Pre-rental Consultation). Tư vấn này là tùy chọn và không phải điều kiện bắt buộc để thực hiện Rental.

Tại bước đặt giữ chỗ, khách hàng lựa chọn 1 trong 2 hình thức canh tác để xác định tổng chi phí:

* **Self-growing:** Khách hàng tự trải nghiệm chăm sóc tại vườn theo quy trình chuẩn tham khảo.  
* **Assisted-growing:** Sử dụng dịch vụ hỗ trợ canh tác trọn gói của hệ thống.

Trong quá trình canh tác, khách hàng có thể tiếp tục trao đổi với Chuyên gia nông nghiệp. Chuyên viên lao động cũng có thể trao đổi với Chuyên gia nông nghiệp khi phát hiện tình trạng bất thường hoặc cần hướng dẫn kỹ thuật hiện trường. Dữ liệu IoT, thời tiết, hình ảnh thực tế, Farm Diary, tiến độ Task và kênh trao đổi giúp người thuê theo dõi và truy vết minh bạch quá trình canh tác. Các dữ liệu này hỗ trợ tối ưu chăm sóc và kiểm soát quy trình, không dùng để tự động tuyên bố nông sản đạt chứng nhận pháp lý an toàn/hữu cơ.

# **2\. MỤC TIÊU**

## **2.1. Mục tiêu tổng quát**

Xây dựng nền tảng cho phép khách hàng thuê các Plot canh tác có sẵn, lựa chọn Crop/Variety phù hợp, quản lý thời gian thuê, theo dõi quá trình sinh trưởng và lựa chọn giữa tự chăm sóc hoặc sử dụng dịch vụ hỗ trợ trọn gói của trang trại.

Mỗi Rental đại diện cho một lượt thuê cụ thể và gắn chặt với:

* Một Khách hàng (KH)  
* Một Thửa đất (Plot)  
* Một Cây trồng/Giống cây (Crop/Variety)  
* Một Ngày bắt đầu (Start Date)  
* Một Ngày kết thúc (End Date)  
* Một Hình thức canh tác (Cultivation Mode)

Hệ thống số hóa chu trình khép kín: Marketplace → Consultation (Tùy chọn) → Reservation (15 phút) → Payment (100% trọn gói, không cọc) → Rental (Confirmed → Active) → Cultivation (Self/Assisted) → Monitoring & Diary → Harvest → Complete Rental. Sau khi thu hoạch và hết hạn thuê, hợp đồng hoàn tất. Mảnh đất sẵn sàng đón lượt thuê mới sau khi ban quản lý trang trại hoàn tất dọn dẹp, cải tạo đất ngoài thực địa.

## **2.2. Mục tiêu cụ thể**

* Cung cấp sàn Marketplace để khách hàng tìm kiếm, lọc và lựa chọn Plot theo vị trí, diện tích, giá và loại rau phù hợp.  
* Cung cấp thông tin chi tiết về từng Plot: hình ảnh, nguồn nước, điều kiện kỹ thuật, lịch khả dụng, thông số IoT và thời tiết.  
* Hỗ trợ chức năng đặt lịch xem đất trực tiếp tại trang trại (Site Visit Booking) trước khi đưa ra quyết định thuê.  
* Hỗ trợ chức năng tư vấn trước khi thuê (Pre-rental Consultation) giữa Khách hàng và Chuyên gia nông nghiệp.  
* Cho phép khách hàng tự chọn Plot, Crop/Variety (bắt buộc trong danh mục được kiểm định), Start Date, End Date và Hình thức canh tác (Self-growing hoặc Assisted-growing).  
* Hệ thống tự động xác thực: Tính tương thích (Compatibility), thời gian sinh trưởng tối thiểu (Expected Duration \+ Buffer Time sinh trưởng) và kiểm tra chống trùng lịch thuê giữa các hợp đồng.  
* Tạo đơn giữ chỗ (Reservation) tạm thời có thời hạn (15 phút).  
* Cho phép thanh toán tiền thuê trọn gói 100% trực tiếp cho Hợp đồng qua Payment Gateway (không qua bảng trung gian Order, không yêu cầu đặt cọc).  
* Sau khi thanh toán thành công, hợp đồng chuyển sang trạng thái Confirmed và tự động chuyển sang Active khi đến Start Date. Hỗ trợ cơ chế Gia hạn hợp đồng (Contract Renewal) kế thừa lịch sử thửa đất.  
* Hỗ trợ 2 hình thức canh tác rõ rệt: Self-growing (tự chăm sóc, được tự đến thu hoạch miễn phí vào cuối tuần, có thể mua thêm Gói ủy thác chăm sóc 1 tháng khi bận) và Assisted-growing (hệ thống tự động sinh Care Task từ Quy trình chuẩn).  
* Khi hợp đồng kết thúc mà không gia hạn, thửa đất tự động chuyển sang trạng thái Bảo dưỡng (MAINTENANCE) trong 4 ngày để xới đất và phơi ải trước khi tự động mở lại khả dụng (AVAILABLE).  
* Admin phân công Chuyên viên lao động (CVLĐ); CVLĐ thực hiện công việc, chụp ảnh minh chứng và khai báo vật tư tiêu hao.  
* Thiết lập 2 kênh trao đổi chuyên biệt: KH ↔ CGNN (tư vấn) và CVLĐ ↔ CGNN (báo cáo kỹ thuật hiện trường).  
* Cung cấp Customer Dashboard trực quan hiển thị tiến độ cây, dữ liệu cảm biến vi khí hậu đo sẵn trên đất (Read-only), thời tiết, Farm Diary và kết quả thu hoạch.  
* Ghi nhận kết quả thu hoạch nông sản sạch (Harvest Result) do CVLĐ cân đo kèm ảnh chụp hiện trường; hỗ trợ tùy chọn tự đến nhận tại vườn (miễn phí) hoặc giao tận nhà (tính phí ship); Khách hàng xác nhận nghiệm thu.

# **3\. ACTOR VÀ VAI TRÒ TRONG HỆ THỐNG**

| Actor Type | Mã | Tên Vai Trò / Dịch Vụ | Nhiệm Vụ Chính |
| :---- | :---- | :---- | :---- |
| **Human Actor** | KH | Khách hàng / Người thuê | Tìm kiếm Plot, thuê đất, chọn hình thức canh tác, theo dõi tiến độ, chat tư vấn, nhận nông sản. |
| **Human Actor** | CGNN | Chuyên gia nông nghiệp | Quản lý tri thức sinh học, thiết lập quy trình canh tác chuẩn, tư vấn KH, hướng dẫn CVLĐ. |
| **Human Actor** | CVLĐ | Chuyên viên lao động | Thực hiện Care Task hiện trường, tải ảnh minh chứng, báo cáo vật tư và sự cố tại vườn. |
| **Human Actor** | AD | Administrator | Quản trị hệ thống, quản lý Plot, cấu hình giá, phân công CVLĐ, giám sát giao dịch và Audit Log. |
| **Supporting** | AI | AI Service | Chatbot hỗ trợ hỏi đáp kiến thức nông nghiệp 24/7 (LLM \+ RAG). |
| **Supporting** | IoT | IoT Sensor Service | Thu thập và mô phỏng dữ liệu nhiệt độ, độ ẩm không khí, độ ẩm đất. |
| **Supporting** | WTH | Weather Service | Cung cấp thông tin dự báo thời tiết địa phương. |
| **Supporting** | PAY | Payment Service | Xử lý giao dịch thanh toán tiền thuê trọn gói và các chi phí phát sinh. |

## **3.1. KH – Khách hàng / Người thuê**

KH là người trực tiếp tìm kiếm và thuê Plot để trải nghiệm làm nông nghiệp sạch. KH có quyền:

* Đăng ký, đăng nhập và quản lý hồ sơ cá nhân.  
* Tìm kiếm, lọc và xem chi tiết thông số Plot trên Marketplace.  
* Yêu cầu CGNN tư vấn trước khi thuê (tùy chọn).  
* Chọn Plot, Crop/Variety, thời gian thuê, hình thức canh tác và tạo đơn giữ chỗ (Reservation).  
* Thanh toán tiền thuê trọn gói 100% qua Payment Gateway.  
* Quản lý tiến độ Hợp đồng và theo dõi tiến trình thực hiện theo Quy trình canh tác chuẩn.  
* Chat với CGNN trong quá trình canh tác khi gặp vấn đề sâu bệnh.  
* Theo dõi Dashboard (tiến độ cây, IoT, thời tiết, ảnh thực địa).  
* Tự tạo bài viết nhật ký (Farm Diary) nếu chọn Self-growing.  
* Đặt dịch vụ chăm sóc phát sinh (Service Request) khi bận đột xuất.  
* Xác nhận kết quả thu hoạch (Harvest Result) và xem lịch sử các kỳ thuê cũ.

## **3.2. CGNN – Chuyên gia nông nghiệp**

CGNN chịu trách nhiệm toàn bộ về tri thức sinh học và tiêu chuẩn kỹ thuật canh tác. CGNN có quyền:

* Quản lý danh mục Cây trồng (Crop) và Giống cây (Variety).  
* Thiết lập bảng tương thích Thổ nhưỡng – Cây trồng (Plot–Crop Compatibility).  
* Xây dựng và quản lý các Quy trình canh tác chuẩn (Standard Process Template) kèm phiên bản.  
* Cấu hình ngưỡng an toàn môi trường IoT (Min/Max nhiệt độ, độ ẩm) cho từng giai đoạn sinh trưởng.  
* Quản lý kho tài liệu kỹ thuật chuyên môn làm cơ sở dữ liệu cho AI.  
* Tư vấn cho KH trước khi thuê (Pre-rental Consultation).  
* Chat tư vấn 1-1 cho KH trong quá trình canh tác.  
* Tiếp nhận báo cáo sự cố (Issue Report) từ CVLĐ và hướng dẫn xử lý kỹ thuật tại vườn.  
* Đề xuất điều chỉnh kế hoạch (Plan Revision) khi có dịch bệnh hoặc biến động thời tiết.

*Lưu ý: CGNN không trực tiếp thực hiện công việc lao động chân tay ngoài vườn.*

## **3.3. CVLĐ – Chuyên viên lao động**

CVLĐ là nhân viên hiện trường thực hiện công việc chăm sóc tại các Plot. CVLĐ có quyền:

* Xem danh sách ca trực và các Care Task được phân công trong ngày.  
* Xem chi tiết vị trí Plot, loại cây và hướng dẫn kỹ thuật của Task.  
* Bắt đầu thực hiện task (chuyển sang In Progress).  
* Tải ảnh minh chứng hiện trường thực tế sau khi làm xong (bắt buộc).  
* Xác nhận hoàn thành task (Completed) để hệ thống tự động đồng bộ sang Farm Diary của KH.  
* Báo cáo sự cố bất thường tại vườn (Issue Report).  
* Chat với CGNN để xin hướng dẫn chuyên môn khi gặp vấn đề sâu bệnh.  
* Hỗ trợ thu hoạch nông sản cho khách và xem lịch sử công việc đã thực hiện.

*Lưu ý: CVLĐ không được tự ý sửa đổi quy trình chăm sóc kỹ thuật đã ban hành.*

## **3.4. AD – Administrator (Chủ trang trại / Quản trị viên)**

AD điều hành và quản trị toàn bộ hoạt động của nền tảng. AD có quyền:

* Quản lý tài khoản người dùng, phân quyền vai trò (RBAC) và khóa/mở tài khoản.  
* Quản trị danh mục Land, chia lô Plot, cập nhật thông số hạ tầng và bật/tắt hiển thị (Published/Hidden).  
* Tra cứu danh mục cây trồng tương thích do CGNN thiết lập để kiểm tra thông số Plot trước khi công bố (không tự ý can thiệp quy chuẩn sinh học của CGNN).  
* Cấu hình đơn giá thuê theo ngày/tháng (100% Upfront, không yêu cầu đặt cọc).  
* Theo dõi các đơn giữ chỗ (Reservation), hợp đồng (Rental) và giao dịch thanh toán (Payment Gateway).  
* Quản lý danh mục dịch vụ phát sinh (Service Management).  
* Phân công Care Task hằng ngày cho CVLĐ và theo dõi tiến độ hoàn thành.  
* Quản lý dữ liệu cảm biến IoT và cấu hình cảnh báo tự động.  
* Xem báo cáo thống kê doanh thu, tỷ lệ lấp đầy Plot và theo dõi System Audit Log.

# **4\. YÊU CẦU CHỨC NĂNG CHI TIẾT**

## **4.1. KH – KHÁCH HÀNG**

* **4.1.1. Quản lý tài khoản:** Đăng ký tài khoản mới bằng Email/Mật khẩu; Đăng nhập, đăng xuất, cập nhật thông tin cá nhân và đổi mật khẩu; Yêu cầu cấp lại / Đặt lại mật khẩu qua Email xác thực; Nhận thông báo trong ứng dụng.  
* **4.1.2. Tìm kiếm Plot trên Marketplace:** Xem danh sách Plot đang mở cho thuê (Listing Status \= Published); Lọc theo vị trí, diện tích, giá thuê, khoảng thời gian và loại rau muốn trồng.  
* **4.1.3. Xem thông tin chi tiết Plot:** Xem mã thửa, diện tích, hình ảnh, đơn giá thuê, nguồn nước, tình trạng kỹ thuật; Xem danh mục cây trồng tương thích, số đo vi khí hậu IoT hiện tại, thời tiết và lịch khả dụng.  
* **4.1.4. Tư vấn trước khi thuê với CGNN (Pre-rental Consultation):** Khách hàng có thể tạo phiên tư vấn hỏi CGNN về việc chọn thửa đất, giống cây phù hợp hoặc thời gian sinh trưởng; CGNN tra cứu thông số Plot và đưa ra khuyến nghị; Bước này là tùy chọn, không bắt buộc và không khóa giữ chỗ Plot.  
* **4.1.5. Lựa chọn Cây trồng, Hình thức canh tác & Giữ chỗ (Reservation):** Chọn giống cây tương thích; Chọn Start Date và End Date; Chọn Hình thức canh tác (Self-growing hoặc Assisted-growing); Hệ thống tự động kiểm tra tương thích, thời lượng sinh trưởng \+ buffer time, chống trùng lịch; Tạo bản ghi Reservation khóa giữ chỗ tạm thời trong 15 phút.  
* **4.1.6. Thanh toán và Kích hoạt hợp đồng Rental:** Màn hình thanh toán hiển thị chi tiết tiền thuê đất \+ gói chăm sóc; Cơ chế Grace Period 10 phút ở trạng thái PAYMENT\_PENDING tránh bị hủy đơn khi nhập OTP; Thanh toán trọn gói 100% qua Payment Gateway (không cọc); Thanh toán thành công chuyển sang Confirmed, đến Start Date chuyển Active.  
* **4.1.7. Thực hiện canh tác theo hình thức đã chọn:**  
  * *Nhánh 1: Self-growing:* Cấp quyền xem Quy trình chuẩn (Read-only); tự ghi Farm Diary; đặt dịch vụ phát sinh; nhận cảnh báo IoT kèm nút tạo yêu cầu cứu hộ nhanh.  
  * *Nhánh 2: Assisted-growing:* Áp dụng 100% Quy trình chuẩn của giống cây; hệ thống tự động sinh Care Task theo ngày; IoT cảnh báo nguy hiểm tự sinh Emergency Care Task cho nhân viên trực ca.  
* **4.1.8. Nhật ký nông trại điện tử (Farm Diary):** Hiển thị Timeline nhật ký; Nhánh Self-growing khách tự nhập bài và ảnh; Nhánh Assisted-growing hệ thống trích xuất từ báo cáo hoàn thành task của CVLĐ.  
* **4.1.9. Kênh trao đổi tư vấn với CGNN:** Chat và gửi hình ảnh chụp cận cảnh lá cây bị sâu bệnh; CGNN kết hợp IoT và Farm Diary đưa ra phác đồ.  
* **4.1.10. Thu hoạch và Hoàn thành hợp đồng:** Ghi nhận thông tin thu hoạch (Harvest Result); Đến End Date hợp đồng chuyển sang Completed, dữ liệu chuyển chế độ Chỉ đọc.

## **4.2. CGNN – CHUYÊN GIA NÔNG NGHIỆP**

* **Quản lý Tri thức:** Quản lý danh mục Crop, Variety, và thiết lập bảng Plot-Crop Compatibility.  
* **Quy trình chuẩn:** Xây dựng Standard Process Template, các bước kỹ thuật canh tác chuẩn theo giống cây (Template Steps).  
* **Tư vấn & Hỗ trợ:** Tiếp nhận tư vấn Pre-rental, chat hỗ trợ KH/CVLĐ và xử lý các Issue Report kỹ thuật từ hiện trường.

## **4.3. CVLĐ – CHUYÊN VIÊN LAO ĐỘNG**

* **Tiếp nhận Task:** Xem danh sách công việc được phân công hằng ngày qua giao diện di động theo từng thửa đất.  
* **Thực thi:** Cập nhật trạng thái In Progress, chụp ảnh minh chứng tại Plot và xác nhận Completed (không phát sinh thủ tục cân đo nhập liệu vật tư).  
* **Báo cáo:** Tạo Issue Report khi phát hiện bất thường tại hiện trường và thực hiện công tác thu hoạch (cân đo, chụp ảnh).

## **4.4. AD – ADMINISTRATOR (QUẢN TRỊ VIÊN)**

* **Quản trị người dùng:** Quản lý tài khoản, phân quyền RBAC (Customer, Expert, Staff).  
* **Quản lý Marketplace:** Cập nhật Plot, Land, cấu hình đơn giá và trạng thái Published/Hidden.  
* **Điều phối vận hành:** Giám sát Hợp đồng, phân công Care Task cho CVLĐ, xử lý Service Request và theo dõi Audit Log.

## **4.5. CÁC DỊCH VỤ PHỤ TRỢ (SUPPORTING SERVICES)**

* **IoT Sensor Service:** Sinh dữ liệu nhiệt độ, độ ẩm mô phỏng chu kỳ 3 giờ/lần theo từng Plot.  
* **Weather Service:** Tích hợp API OpenWeatherMap hiển thị dự báo thời tiết 3-5 ngày.  
* **AI Chatbot Assistant:** Hỗ trợ KH tra cứu thông tin về quy trình trồng (Dùng LLM & RAG).  
* **Payment Service:** Xử lý giao dịch thanh toán tiền thuê trọn gói và phí dịch vụ phát sinh (Pending, Success, Failed, không đặt cọc).

# **5\. LUỒNG NGHIỆP VỤ TỔNG QUÁT**

1. **KHÁM PHÁ & KÝ HỢP ĐỒNG:** Admin công bố Plot → KH tìm kiếm & chọn một hoặc nhiều Plot → Cấu hình Giống rau + Hình thức canh tác (Self / Assisted) cho từng Plot → Kiểm tra hợp lệ & Thời hạn thuê chung → Khóa giữ chỗ Reservation (15 phút + 10 phút Grace Period) → Ký Hợp đồng điện tử và Thanh toán trọn gói 100% một lần duy nhất → Hợp đồng chuyển sang Confirmed (Chờ Start Date → Active, bàn giao các Plot độc lập trên Dashboard).  
2. **CANH TÁC & VẬN HÀNH TỪNG PLOT:**  
   * *Nhánh A (Self-growing):* KH xem Quy trình chuẩn tham khảo (Read-only) → Tự do canh tác & Tự ghi Farm Diary → Cảnh báo IoT có nút cứu hộ nhanh → Mua dịch vụ lẻ hoặc Gói ủy thác tùy chọn ngày khi bận.  
   * *Nhánh B (Assisted-growing):* Hệ thống áp dụng 100% Quy trình chuẩn của giống → Tự động sinh Care Task theo ngày gắn với từng Plot → Phân công CVLĐ → CVLĐ thực hiện hiện trường, chụp ảnh minh chứng → Tự động đồng bộ Farm Diary. Cảnh báo IoT nguy hiểm kéo dài (>30 phút) → Tự động sinh Emergency Care Task (độ ưu tiên cao).  
3. **XỬ LÝ SỰ CỐ:** CVLĐ/KH phát hiện bất thường → Tạo Issue Report & Chat CGNN → CGNN hướng dẫn kỹ thuật hiện trường.  
4. **THU HOẠCH & KẾT THÚC:** Từng thửa đất đến kỳ thu hoạch → CVLĐ cắt, cân điện tử & chụp ảnh lưu Harvest Result kèm staff_id → KH nghiệm thu → Đến End Date hợp đồng (không Renew) → Completed → Thửa đất chuyển sang MAINTENANCE (4 ngày) dọn dẹp phơi ải trước khi mở lại AVAILABLE.

# **6\. CẤU TRÚC DASHBOARD CÁC ACTOR**

* **KH Dashboard:** Quản lý Hợp đồng tổng thể và danh sách các Plot được bàn giao ("Vườn của tôi"), theo dõi tiến độ cây, dữ liệu vi khí hậu IoT & Thời tiết từng Plot, Farm Diary Timeline, nút Gia hạn (Renew), khung chat CGNN và nghiệm thu thu hoạch.  
* **CGNN Dashboard:** Quản lý Cây trồng & Quy trình kỹ thuật chuẩn, bảng tương thích, kênh chat hỗ trợ KH/CVLĐ, quản lý Issue Report.  
* **CVLĐ Dashboard (Mobile):** Lịch công việc hôm nay theo từng thửa đất, chi tiết vị trí Plot, form cập nhật tiến độ (ảnh minh chứng hiện trường + ghi chú), kênh báo cáo sự cố.  
* **AD Dashboard:** Tỷ lệ lấp đầy, doanh thu, quản lý người dùng/RBAC, danh mục Plot, điều phối Care Task, giám sát cảnh báo IoT và System Audit Log.

# **7\. DỮ LIỆU CỐT LÕI VÀ BUSINESS RULES**

## **7.1. Danh mục Thực thể dữ liệu chính (Entities)**

User, Role, Land, Plot, SiteVisit, Crop, Variety, PlotCropCompatibility, ProcessTemplate, TemplateStep, KnowledgeDocument, Service, Contract, ContractPlot, ServiceRequest, CancellationRequest, PaymentTransaction, CareTask, FarmDiary, HarvestResult, SensorReading, IssueReport, Conversation, Message, Notification, AuditLog.

## **7.2. Các Business Rules cốt lõi**

* **BR01 – Quyền sở hữu và vận hành trang trại:** Nền tảng trực tiếp sở hữu và vận hành khu trang trại. Plot được quy hoạch và cấu hình sẵn trước khi được công bố; không hỗ trợ C2C.  
* **BR02 – Đơn vị Plot:** Plot là đơn vị đất canh tác nhỏ nhất. Có vị trí, diện tích, kỹ thuật, lịch khả dụng, danh mục tương thích và dữ liệu IoT.  
* **BR03 – Tính tương thích cây trồng & Danh mục kiểm định bắt buộc:** Khách hàng bắt buộc chọn giống cây trong Danh mục kiểm định và tương thích với Plot (`plot_crop_compatibility`). Tuyệt đối không tự ý mang giống trôi nổi vào vườn.  
* **BR04 – Thời gian thuê tối thiểu:** Thời gian thuê phải ≥ thời gian sinh trưởng dự kiến của Variety cộng với Buffer Time.  
* **BR05 – Phạm vi Hợp đồng (Master Lease Agreement) và Phụ lục Plot (Contract Plots):** Một hợp đồng đại diện cho một kỳ thuê khoán đất nông nghiệp trọn gói của khách hàng. Khách hàng có thể đăng ký thuê một hoặc nhiều Plot trong cùng một Hợp đồng (thông qua Phụ lục `ContractPlot`). Mỗi Plot trong hợp đồng được cấu hình với một giống cây tương thích và một hình thức canh tác riêng (ví dụ: Plot Cải chọn Self-growing, Plot Cà rốt chọn Gói ủy thác). Khách hàng ký hợp đồng 1 lần và thanh toán 1 lần duy nhất; sau khi kích hoạt, hệ thống bàn giao quyền quản lý từng Plot độc lập trên Dashboard.  
* **BR06 – Đặt lịch xem đất (Site Visit Booking) & Tư vấn trước khi thuê:** Hỗ trợ khách vãng lai và khách tiềm năng đặt lịch tham quan trang trại (ca sáng/chiều) chỉ bằng Họ tên và Số điện thoại. Tư vấn CGNN trực tuyến là tùy chọn.  
* **BR07 – Giữ chỗ (Reservation) và Chống trùng lịch:** Kiểm tra khả dụng của từng Plot trước khi giữ chỗ. Start Date của lượt thuê mới cho mỗi Plot phải sau End Date (+ 4 ngày phơi ải bảo dưỡng đất) của lượt thuê trước đó.  
* **BR08 – Thời hạn Reservation và thời gian ân hạn (Grace Period):** Thời hạn 15 phút. Khi sang cổng thanh toán được cộng thêm 10 phút đệm (trạng thái PAYMENT_PENDING).  
* **BR09 – Ký Hợp đồng & Thanh toán trọn gói:** Khách hàng thanh toán trước 100% tổng giá trị hợp đồng trực tiếp một lần (không cọc, không bảng Order). Toàn bộ chi phí cây giống, phân bón, chế phẩm sinh học đã tính trọn gói trong giá thuê đất và gói dịch vụ; hệ thống không quản lý bán lẻ hay theo dõi định mức vật tư tiêu hao riêng lẻ (No Material tracking).  
* **BR10 – Yêu cầu Hủy Hợp đồng & Quy trình Hoàn tiền:** Gửi `cancellation_requests` trước ngày bắt đầu. Khấu trừ theo mốc:  
  * Trước ≥ 3 ngày: Khấu trừ 20% (hoàn 80%).  
  * Trước < 3 ngày: Khấu trừ 50% (hoàn 50%).  
  * Đến ngày Start Date: Không hoàn tiền.  
* **BR11 – Hai hình thức canh tác & Gói ủy thác chăm sóc theo ngày/tháng:** Self-growing (tự chăm sóc) và Assisted-growing (hỗ trợ trọn gói). Khách Self-growing có thể mua Gói ủy thác chăm sóc tùy chọn ngày khi bận.  
* **BR11b – Gia hạn Hợp đồng (Contract Renewal):** Cho gia hạn nếu lịch các Plot trong hợp đồng còn trống. Thực hiện trước tối thiểu 3 ngày. Hợp đồng mới kế thừa thông qua `parent_contract_id`. Hợp đồng cũ duy trì trạng thái ACTIVE tới hết kỳ rồi mới chuyển RENEWED.  
* **BR12 – Quy trình Canh tác chuẩn hóa theo Giống cây:** Quy trình kỹ thuật canh tác (`template_steps`) gắn liền với giống cây trồng, do CGNN thiết lập, áp dụng 100% cho Assisted-growing (không may đo tùy biến). Mỗi bước mô tả hành động kỹ thuật và hướng dẫn công việc, không phát sinh quản lý định mức vật tư.  
* **BR12b – Đề xuất canh tác cho khách hàng Tự trồng (Self-growing):** Hệ thống hiển thị công thức canh tác mẫu do CGNN đề xuất để người tự trồng tham khảo. Khách hàng có toàn quyền áp dụng theo công thức khuyến nghị hoặc tự do canh tác theo kinh nghiệm riêng mà không cần CGNN phê duyệt.  
* **BR14 – Phân công và thực hiện Care Task:** Hệ thống tự động sinh Care Task cho từng Plot của Hợp đồng. Chỉ giao cho CVLĐ đảm nhiệm thực hiện hiện trường. Sau 23:59 ngày thực hiện chưa xong thì tự động chuyển trạng thái Overdue để Admin điều phối.  
* **BR15 – Minh chứng hoàn thành Task:** Bắt buộc có ít nhất 1 ảnh chụp thực tế tại Plot trước khi chuyển Completed. Không yêu cầu nhập liệu số lượng vật tư tiêu hao.  
* **BR17 – Đồng bộ Farm Diary:** Task completed tự động ghi nhận một bài viết vào Farm Diary của Plot thuộc Hợp đồng kèm ảnh minh chứng hiện trường.  
* **BR18 – Xử lý dữ liệu IoT, Thời tiết và Cảnh báo hành động:** Cảnh báo kéo dài (>30 phút): Assisted-growing tự sinh Emergency Care Task (độ ưu tiên cao); Self-growing gửi cảnh báo kèm nút cứu hộ nhanh. Nếu dự báo mưa lớn hoặc độ ẩm đất ≥ 80% thì tự hoãn task tưới.  
* **BR19 – AI chatbot assistant:** Hỗ trợ tra cứu kiến thức chung, bệnh cây, đề xuất phương pháp xử lý dựa trên kho tài liệu RAG.  
* **BR20 – Thu hoạch và Trách nhiệm nhập dữ liệu:** CVLĐ trực tiếp cắt, cân điện tử, chụp ảnh làm minh chứng và submit số kg thực tế vào `harvest_results` (gắn `staff_id`). Khách hàng nghiệm thu.  
* **BR21 – Quyền quyết định sản lượng & Chính sách vận chuyển:** Khách có quyền tự đến nhận tại vườn cuối mùa vụ (miễn phí) hoặc yêu cầu giao tận nhà (tính phí ship).  
* **BR22 – Kết thúc Hợp đồng:** Đến End Date chuyển sang Completed, dữ liệu chuyển Chỉ đọc (Read-only).  
* **BR23 – Giải phóng Plot & Quy trình Nghỉ đất (Maintenance Period):** Thửa đất sau khi thu hoạch chuyển sang trạng thái MAINTENANCE để dọn dẹp, xới đất, phơi ải (4 ngày) trước khi chuyển lại AVAILABLE.  
* **BR24 – Phân quyền dữ liệu:** CGNN truy cập Plot được phân công; CVLĐ truy cập Task được giao.  
* **BR25 – Kênh giao tiếp:** KH ↔ CGNN tư vấn; CVLĐ ↔ CGNN báo cáo kỹ thuật. Khách không chỉ đạo trực tiếp CVLĐ.  
* **BR26 – Dữ liệu và chứng nhận:** Dữ liệu phục vụ minh bạch, không thay thế chứng nhận pháp lý.  
* **BR27 – Component Dịch vụ (Services Master) & Tự động sinh Care Task:** Quản lý qua bảng Master `services`: Dịch vụ lẻ theo lượt (A-la-carte) và Gói ủy thác chăm sóc trọn gói theo ngày/tháng (đơn giá = phí ngày x 1.2).

# **8\. PHẠM VI PROTOTYPE (SCOPE BOUNDARIES)**

## **Trong phạm vi (In-Scope)**

* Đầy đủ chức năng cho 4 Actor  
* Sàn Marketplace tìm kiếm và lọc Plot  
* Quản lý Rental & Payment thanh toán trọn gói 100% (không cọc)  
* Care Task tự động sinh & Đồng bộ Farm Diary  
* Tích hợp IoT Sensor Service & Weather API  
* AI Chatbot tra cứu quy trình  
* Quản lý thu hoạch và nghiệm thu

## **Ngoài phạm vi (Out-of-Scope)**

* Không làm sàn C2C cho người dùng tự đăng tin đất  
* Không lắp phần cứng IoT vật lý  
* Không tích hợp thanh toán ngân hàng thật  
* Không làm hệ thống thương mại điện tử / Logistics tự động  
* Không làm hệ thống Payroll / Chấm công phức tạp

# **9\. CÔNG NGHỆ VÀ CÔNG CỤ (TECHNOLOGY STACK)**

* **Frontend:** ReactJS, TailwindCSS, Recharts  
* **Backend:** Java Spring Boot (17/21), RESTful API  
* **Database:** PostgreSQL & pgAdmin 4  
* **Bảo mật:** Spring Security, JWT, RBAC  
* **Dịch vụ tích hợp:** OpenWeatherMap API, IoT Service, LLM API, RAG, WebSocket Chat

# **10\. GIẢ ĐỊNH VÀ GIỚI HẠN PROTOTYPE**

## **10.1. Giả định (Assumptions)**

* Hệ thống hoạt động ổn định trong chu kỳ demo.  
* IoT sensors chính xác, dữ liệu đáng tin cậy.  
* Weather API luôn available và phản hồi nhanh.  
* CVLĐ có smartphone và kết nối internet ổn định tại vườn.  
* Đủ nhân sự trực ca trong giờ hành chính (8:00-17:00).  
* Payment Gateway mock trả về Success.  
* Khách hàng tuân thủ quy định trang trại.  
* CGNN có chuyên môn cấu hình đúng quy trình.  
* AI Chatbot chỉ trả lời câu hỏi chung.  
* Quản lý một trang trại duy nhất tối đa 50 Plot.

## **10.2. Giới hạn (Limitations)**

* Không hỗ trợ đa ngôn ngữ (chỉ Tiếng Việt).  
* Chat dùng HTTP polling 5s thay vì WebSocket real-time.  
* Mock payment, không tích hợp cổng ngân hàng thật.  
* Không có logistics vận chuyển tự động.  
* Không có module chấm công / tính lương Payroll.  
* IoT data mô phỏng ngẫu nhiên chu kỳ 3 giờ.  
* AI Chatbot không lưu bộ nhớ giữa các phiên.  
* Cố định múi giờ GMT+7.  
* CVLĐ dùng responsive web trên di động.  
* Tranh chấp xử lý thủ công bởi Admin.  
* Không cấp chứng nhận an toàn thực phẩm pháp lý.  
* Upload ảnh giới hạn 5MB/file, tối đa 10 ảnh/Task.

## **10.3. Rủi ro và Xử lý (Risks & Mitigation)**

| Rủi Ro Phát Sinh | Giải Pháp Xử Lý (Mitigation) |
| :---- | :---- |
| **Cảm biến IoT lỗi/nhiễu** | Lọc bỏ reading bất thường (\<0°C hoặc \>50°C), ghi cảnh báo cho Admin. |
| **Weather API không khả dụng** | Báo dữ liệu tạm thời không khả dụng, không tự động pause task tưới. |
| **CVLĐ trễ hạn Task** | Sau 23:59 tự động chuyển Overdue, gửi cảnh báo cho Admin điều phối sáng hôm sau. |
| **Hủy hợp đồng sát ngày** | Khấu trừ tự động theo chính sách điều khoản quy định tại BR10. |
| **Trùng lịch thuê Plot (Race condition)** | Sử dụng Isolation Level SERIALIZABLE và SELECT FOR UPDATE khi tạo Reservation. |

