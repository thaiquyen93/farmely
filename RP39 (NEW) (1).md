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
* Giá thuê1   
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
* Giá thuê tháng đầu tiên đã bao gồm trọn gói 01 bộ Starter Kit (cây con giống F1 đã ươm sẵn \+ khay giá thể hữu cơ ban đầu).  
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
* **Quy trình chuẩn:** Xây dựng Standard Process Template, Template Version, và định mức vật tư tiêu hao.  
* **Tư vấn & Phê duyệt:** Tiếp nhận tư vấn Pre-rental, chat hỗ trợ KH/CVLĐ và xử lý các Issue Report kỹ thuật từ hiện trường.

## **4.3. CVLĐ – CHUYÊN VIÊN LAO ĐỘNG**

* **Tiếp nhận Task:** Xem danh sách công việc được phân công hằng ngày qua giao diện di động.  
* **Thực thi:** Cập nhật trạng thái In Progress, chụp ảnh minh chứng tại Plot và xác nhận Completed.  
* **Báo cáo:** Tạo Issue Report khi phát hiện bất thường tại hiện trường và hỗ trợ công tác thu hoạch.

## **4.4. AD – ADMINISTRATOR (QUẢN TRỊ VIÊN)**

* **Quản trị người dùng:** Quản lý tài khoản, phân quyền RBAC (Customer, Expert, Staff).  
* **Quản lý Marketplace:** Cập nhật Plot, Land, cấu hình đơn giá và trạng thái Published/Hidden.  
* **Điều phối vận hành:** Giám sát Rental/Reservation, phân công Care Task cho CVLĐ, xử lý Service Request và theo dõi Audit Log.

## **4.5. CÁC DỊCH VỤ PHỤ TRỢ (SUPPORTING SERVICES)**

* **IoT Sensor Service:** Sinh dữ liệu nhiệt độ, độ ẩm mô phỏng chu kỳ 3 giờ/lần.  
* **Weather Service:** Tích hợp API OpenWeatherMap hiển thị dự báo thời tiết 3-5 ngày.  
* **AI Chatbot Assistant:** Hỗ trợ KH tra cứu thông tin về quy trình trồng (Dùng LLM & RAG).  
* **Payment Service:** Xử lý giao dịch thanh toán tiền thuê trọn gói và phí dịch vụ phát sinh (Pending, Success, Failed, không đặt cọc).

# **5\. LUỒNG NGHIỆP VỤ TỔNG QUÁT**

1. **KHÁM PHÁ & THUÊ:** Admin công bố Plot → KH tìm kiếm & xem chi tiết → KH chọn Giống rau \+ Thời gian \+ Hình thức canh tác (Self / Assisted) → Kiểm tra hợp lệ → Khóa giữ chỗ Reservation (15 phút \+ 10 phút Grace Period) → Thanh toán trọn gói 100% thành công → Rental chuyển sang Confirmed (Chờ Start Date → Active).  
2. **CANH TÁC:**  
   * *Nhánh A (Self-growing):* KH xem Quy trình chuẩn (Read-only) → Tự ghi Farm Diary → Cảnh báo IoT có nút cứu hộ nhanh → Chat CGNN khi cần.  
   * *Nhánh B (Assisted-growing):* Áp dụng Quy trình chuẩn → Tự sinh Care Task → Phân công CVLĐ → CVLĐ thực hiện, chụp ảnh & ghi vật tư → Đồng bộ Farm Diary. Cảnh báo nguy hiểm kéo dài → Tự sinh Emergency Care Task.  
3. **XỬ LÝ SỰ CỐ:** CVLĐ/KH phát hiện bất thường → Tạo Issue Report & Chat CGNN → CGNN hướng dẫn kỹ thuật hiện trường.  
4. **THU HOẠCH & KẾT THÚC:** Đến kỳ thu hoạch → CVLĐ cân đo & chụp ảnh lưu Harvest Result → KH nghiệm thu → Hết hạn End Date (không Renew) → Completed → Plot chuyển sang MAINTENANCE (4 ngày) dọn dẹp phơi ải trước khi mở lại AVAILABLE.

# **6\. CẤU TRÚC DASHBOARD CÁC ACTOR**

* **KH Dashboard:** Tổng quan hợp đồng, tiến độ cây, dữ liệu vi khí hậu & Thời tiết, Farm Diary Timeline, nút Gia hạn (Renew), khung chat CGNN và nghiệm thu thu hoạch.  
* **CGNN Dashboard:** Quản lý Cây trồng & Quy trình chuẩn, bảng tương thích, kênh chat hỗ trợ KH/CVLĐ, quản lý Issue.  
* **CVLĐ Dashboard (Mobile):** Lịch công việc hôm nay, chi tiết vị trí Plot, form cập nhật tiến độ (ảnh \+ vật tư), kênh báo cáo sự cố.  
* **AD Dashboard:** Tỷ lệ lấp đầy, doanh thu, quản lý người dùng/RBAC, danh mục Plot, điều phối Care Task, giám sát cảnh báo IoT và System Audit Log.

# **7\. DỮ LIỆU CỐT LÕI VÀ BUSINESS RULES**

## **7.1. Danh mục Thực thể dữ liệu chính (Entities)**

User, Role, Land, Plot, SiteVisit, Crop, Variety, PlotCropCompatibility, ProcessTemplate, TemplateStep,KnowledgeDocument, Service, Contract, ServiceRequest, CancellationRequest, PaymentTransaction, CareTask,, FarmDiary, HarvestResult, SensorReading, IssueReport, Conversation, Message, Notification, AuditLog.

## **7.2. Các Business Rules cốt lõi**

* **BR01 – Quyền sở hữu và vận hành trang trại:** Nền tảng trực tiếp sở hữu và vận hành trang trại. Các Plot được quy hoạch và cấu hình sẵn trước khi công bố cho thuê. Hệ thống không hỗ trợ mô hình khách hàng hoặc chủ đất bên ngoài đăng đất cho thuê (C2C).  
* **BR02 – Đơn vị Plot:** Plot là đơn vị đất canh tác nhỏ nhất được quản lý và cho thuê trên hệ thống. Mỗi Plot có thông tin về vị trí, diện tích, điều kiện kỹ thuật, lịch khả dụng, danh mục giống cây tương thích và dữ liệu IoT.  
* **BR03 – Giống cây được phê duyệt và tính tương thích:** Khách hàng phải chọn giống cây thuộc danh mục được trang trại phê duyệt và phù hợp với Plot đã chọn. Khách hàng không được tự ý mang giống cây ngoài danh mục vào trang trại để canh tác.  
* **BR04 – Thời gian thuê tối thiểu:** Thời gian thuê phải bằng hoặc dài hơn thời gian sinh trưởng dự kiến của giống cây đã chọn cộng với thời gian dự phòng (Buffer Time).  
* **BR05 – Phạm vi hợp đồng và cấu hình từng Plot:** Một hợp đồng có thể bao gồm một hoặc nhiều Plot do khách hàng lựa chọn. Mỗi Plot trong hợp đồng được cấu hình độc lập về giống cây tương thích, ngày bắt đầu, ngày kết thúc và hình thức canh tác. Các Plot trong cùng hợp đồng không bắt buộc có cùng giống cây, thời gian thuê hoặc hình thức canh tác.  
* **BR06 – Đặt lịch tham quan và tư vấn trước khi thuê:** Khách vãng lai và khách hàng tiềm năng có thể đặt lịch tham quan trang trại theo ca sáng hoặc chiều bằng cách cung cấp họ tên và số điện thoại. Tư vấn trực tuyến với Chuyên gia nông nghiệp (CGNN) trước khi thuê là tùy chọn, không phải điều kiện bắt buộc để đặt thuê Plot.  
* **BR07 – Giữ chỗ và chống trùng lịch:** Chỉ các Plot đã được công bố cho thuê và khả dụng trong toàn bộ khoảng thời gian khách chọn mới được giữ chỗ. Khoảng thời gian thuê không được trùng với hợp đồng đã xác nhận hoặc đang hoạt động, lượt giữ chỗ còn hiệu lực hoặc thời gian nghỉ đất của Plot.  
* **BR08 – Thời hạn giữ chỗ và thời gian ân hạn:** Mỗi lượt giữ chỗ có thời hạn 15 phút. Khi khách hàng chuyển sang bước thanh toán, lượt giữ chỗ chuyển sang trạng thái chờ thanh toán và được cộng thêm 10 phút ân hạn. Thời gian ân hạn chỉ được cộng một lần cho mỗi lượt giữ chỗ.  
* **BR09 – Thanh toán hợp đồng:** Khách hàng phải thanh toán trước 100% tổng giá trị hợp đồng, bao gồm tiền thuê Plot và phí chăm sóc áp dụng theo hình thức canh tác đã chọn. Hệ thống không yêu cầu đặt cọc.  
* **BR10 – Hủy hợp đồng và hoàn tiền:** Khách hàng phải gửi yêu cầu hủy hợp đồng và hoàn tiền trước ngày bắt đầu thuê. Mức hoàn tiền được xác định theo thời điểm gửi yêu cầu:  
  * Trước ngày bắt đầu ít nhất 3 ngày: khấu trừ 20%, hoàn lại 80% số tiền đã thanh toán.  
  * Trước ngày bắt đầu dưới 3 ngày: khấu trừ 50%, hoàn lại 50% số tiền đã thanh toán.  
  * Từ ngày bắt đầu thuê trở đi: không hoàn tiền.  
* **BR11 – Hình thức canh tác và gói chăm sóc theo ngày:** Hệ thống hỗ trợ hai hình thức canh tác: Self-growing, trong đó khách hàng tự chăm sóc cây; và Assisted-growing, trong đó trang trại cung cấp dịch vụ chăm sóc trọn gói. Khách hàng Self-growing có thể mua gói ủy thác chăm sóc theo số ngày tùy chọn khi không thể tự chăm sóc.  
* **BR12 – Gia hạn hợp đồng:** Khách hàng được gia hạn hợp đồng nếu các Plot cần gia hạn còn khả dụng trong khoảng thời gian tiếp theo. Việc gia hạn phải được thực hiện trước ngày kết thúc hợp đồng ít nhất 3 ngày. Hợp đồng hiện tại tiếp tục ở trạng thái Active đến hết kỳ thuê, sau đó chuyển sang Renewed khi đã gia hạn thành công.  
* **BR13 – Quy trình canh tác chuẩn theo giống cây:** Mỗi giống cây có quy trình canh tác chuẩn do CGNN thiết lập. Các Plot áp dụng hình thức Assisted-growing phải tuân thủ đầy đủ quy trình này, không hỗ trợ tùy chỉnh quy trình riêng cho từng khách hàng.  
* **BR14 – Hướng dẫn canh tác cho khách hàng tự chăm sóc:** Khách hàng Self-growing có thể tham khảo quy trình chuẩn của CGNN hoặc lựa chọn cách chăm sóc riêng. Những thay đổi so với quy trình chuẩn phải được CGNN phê duyệt hoặc hướng dẫn trước khi thực hiện.  
* **BR15 – Phân công và thực hiện công việc chăm sóc:** Các công việc chăm sóc định kỳ và công việc phát sinh từ yêu cầu dịch vụ chỉ được giao cho Công nhân vận hành (CVLĐ) thực hiện. Công việc chưa hoàn thành sau 23:59 của ngày được lên lịch sẽ tự động chuyển sang trạng thái Overdue.  
* **BR16 – Minh chứng hoàn thành công việc:** CVLĐ phải cung cấp ít nhất một ảnh chụp thực tế tại Plot trước khi được xác nhận công việc ở trạng thái Completed.  
* **BR17 – Đồng bộ nhật ký canh tác:** Khi công việc chăm sóc được hoàn thành, hệ thống tự động ghi nhận nội dung thực hiện và minh chứng vào nhật ký canh tác của Plot thuộc hợp đồng tương ứng.  
* **BR18 – Dữ liệu môi trường và cảnh báo hành động:** Khi cảnh báo môi trường kéo dài hơn 30 phút, hệ thống xử lý theo hình thức canh tác:  
  * Assisted-growing: tự động tạo công việc chăm sóc khẩn cấp trong khung giờ 08:00–17:00.  
  * Self-growing: gửi cảnh báo cho khách hàng kèm tùy chọn yêu cầu dịch vụ chăm sóc nhanh.  
* Khi dự báo có mưa lớn hoặc độ ẩm đất đạt từ 80% trở lên, hệ thống tự động hoãn công việc tưới nước liên quan.  
* **BR19 – Trợ lý AI:** Chatbot AI hỗ trợ khách hàng tra cứu kiến thức canh tác chung, tìm hiểu bệnh cây và tham khảo các phương pháp xử lý.  
* **BR20 – Thực hiện và ghi nhận thu hoạch:** CVLĐ thực hiện thu hoạch, cân sản lượng bằng cân điện tử, chụp ảnh minh chứng và gửi kết quả lên hệ thống. Khách hàng xem và xác nhận nghiệm thu kết quả thu hoạch.  
* **BR21 – Thời gian và địa điểm thu hoạch:** Việc thu hoạch được thực hiện tại trang trại vào cuối vụ canh tác.  
* **BR22 – Kết thúc hợp đồng:** Lượt thuê của mỗi Plot kết thúc theo ngày kết thúc riêng. Khi lượt thuê kết thúc, hệ thống ngừng tạo công việc canh tác mới cho Plot đó nhưng vẫn cho phép xử lý các yêu cầu còn tồn đọng. Các Plot khác trong cùng hợp đồng tiếp tục hoạt động theo thời gian thuê tương ứng. Hợp đồng chỉ chuyển sang trạng thái Completed khi tất cả lượt thuê Plot thuộc hợp đồng đã kết thúc.  
* **BR23 – Giải phóng Plot và nghỉ đất:** Sau khi lượt thuê kết thúc mà không được gia hạn, Plot chuyển sang trạng thái Maintenance để dọn dẹp, xới đất và phơi ải. Trang trại quyết định thời điểm hoàn tất nghỉ đất và mở lại Plot cho thuê.  
* **BR24 – Phạm vi truy cập dữ liệu:** CGNN chỉ được truy cập dữ liệu vận hành của các Plot được phân công. CVLĐ chỉ được truy cập công việc được giao và thông tin liên quan cần thiết để thực hiện công việc đó.  
* **BR25 – Kênh giao tiếp:** Hệ thống hỗ trợ trao đổi giữa khách hàng và CGNN để tư vấn, và giữa CVLĐ và CGNN để báo cáo hoặc nhận hướng dẫn kỹ thuật. Khách hàng không trực tiếp giao việc hoặc chỉ đạo CVLĐ qua hệ thống.

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

