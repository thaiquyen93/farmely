# Đặc tả kiểm thử 4 luồng Farmely — bản để duyệt

**Ngày lập:** 30/10/2026 · **Trạng thái:** DRAFT. Đã triển khai và chạy 6 ID trong Playwright; kết quả chi tiết ở [báo cáo 30/10/2026](playwright-run-2026-10-30.md). Đây là test case bằng ngôn ngữ nghiệp vụ; những ID còn lại chưa có Playwright spec. Bộ 21 test chỉ đọc đã có từ trước là một công việc khác.

## 1. Phạm vi và cách đọc

Tài liệu bám đúng bốn luồng trong ảnh: (1) Chuẩn bị để cho thuê — 16 case; (2) Khách thuê và đặt dịch vụ — 24 case; (3) Canh tác đến nhận nông sản — 23 case; (4) Đo hiệu quả kinh doanh — 13 case. **Tổng 76 case.** Mỗi case có **hành động** và **kết quả phải kiểm tra**. `S` = smoke cần có trước, `R` = regression; `I` = UI + API + kiểm tra bản ghi DB test, `U` = UI + API, `A` = API hoặc tác vụ nền. Trạng thái thực thi của 6 ID đã chạy được ghi trong báo cáo; 70 ID còn lại chưa chạy.

Phạm vi role thực có trong code: `ADMIN`, `EXPERT`, `CUSTOMER`, `FIELD_WORKER` (UI gọi `STAFF`). Không có role LANDOWNER. Đăng nhập demo/localStorage chỉ đủ thử điều hướng UI; các test quyền backend phải dùng JWT của user test thật.

**Nguồn đối chiếu chính:** `frontend/src/App.jsx`, `frontend/src/pages/admin/*`, `frontend/src/pages/public/{Marketplace,PlotDetail,BookPlot}.jsx`, dashboard Customer/Expert/Staff, `frontend/server/siteVisitsApiPlugin.js`, `frontend/vite.config.js`, các service Spring `farm`, `knowledge`, `rental`, `cultivation`, `payment`, `monitoring`, và `Database/farmely_full_database.sql`. Đường chạy `localhost:3000` dùng Vite plugin cho nhiều `/api/*` rồi proxy các route còn lại sang Spring. Cùng một tính năng có thể có hai đường thực thi; khi viết Playwright cần khóa rõ **runtime mục tiêu** trước khi so sánh kết quả.

### Dữ liệu test phải chuẩn bị sau khi duyệt

| Mã fixture | Dữ liệu cần có | Dùng cho |
| --- | --- | --- |
| ACT | Admin A, Expert E, Staff S, Customer C1 và C2, đều có JWT test thật | Quyền và workflow liên role |
| LAND | Nông trại L1 có ranh giới hợp lệ; L2 để thử trùng tên/ranh giới | Luồng 1 |
| PLOTS | P1 khả dụng chưa công bố; P2 đã công bố; P3 đang thuê; P4 bảo dưỡng; P5 có lịch thuê chồng lấn | Luồng 1–3 |
| BIO | Giống V1 hợp P1/P2, V2 không hợp P1; chu kỳ và buffer đã biết; template T1 có ít nhất 2 bước | Luồng 1–3 |
| SERVICE | Dịch vụ lẻ D1 và gói chăm sóc D2 có giá xác định | Luồng 1–3 |
| RENT | Một hợp đồng `PENDING_PAYMENT`, một hợp đồng đã thanh toán, một rental `ACTIVE`, một rental sắp hết hạn | Luồng 2–3 |
| OPS | Task được giao S, task quá hạn, issue mở, harvest chờ xác nhận, sensor reading bình thường và vượt ngưỡng | Luồng 3–4 |
| LEDGER | Giao dịch thuê và dịch vụ `SUCCESS`, một `PENDING`, một `FAILED`, một hoàn tiền; mốc tháng đã biết | Luồng 4 |

Mỗi case ghi dữ liệu bằng mã fixture riêng, tạo mới hoặc reset về snapshot trước khi chạy; không phụ thuộc case chạy trước. Ngày thuê dùng mốc tương đối với ngày chạy: ngày bắt đầu hợp lệ từ **T+5 đến T+14 ngày, tính cả hai đầu mút**, thống nhất giữa `BookPlot`, API frontend và `ContractServiceImpl`. Cần đồng hồ điều khiển được cho case hết hạn 15 phút, ân hạn 10 phút, ngày kết thúc và cảnh báo; không chờ bằng `sleep` thật. Chỉ thực thi case ghi/xóa khi mọi `DB_URL` đã xác nhận trỏ vào PostgreSQL test riêng. Không gọi cổng thanh toán thật. Không ghi body `/api/users`, JWT, số thẻ hay thông tin cá nhân vào report/trace.

## 2. Luồng 1 — Chuẩn bị để cho thuê

**Mục tiêu:** Admin tạo đất và thửa; Expert thiết lập giống phù hợp/quy trình; Admin thiết lập giá, dịch vụ và công bố; khách nhìn thấy đúng thông tin trên Marketplace.

| ID | Case / hành động | Kết quả cần kiểm tra | Mức |
| --- | --- | --- | --- |
| F1-01 | A tạo L1 với tên, địa chỉ và ranh giới hợp lệ; mở lại trang chi tiết | L1 xuất hiện một lần, dữ liệu lưu bền sau reload, hình học nằm đúng vị trí | S·I |
| F1-02 | Bỏ trống tên/địa chỉ hoặc dùng tên L1 đã tồn tại | Form báo lỗi tương ứng; API từ chối trùng tên; không có bản ghi thứ hai | R·I |
| F1-03 | Vẽ ranh giới tự cắt hoặc tọa độ không hợp lệ | Không lưu; UI/API báo lỗi ranh giới; số nông trại không đổi | R·I |
| F1-04 | A tạo P1 trong L1, mã duy nhất, diện tích/giá hợp lệ | P1 lưu với `status=AVAIL`, `isPublished=false` mặc định; chưa xuất hiện trên Marketplace | S·I |
| F1-05 | Tạo thửa trùng mã, ngoài ranh giới L1 hoặc chồng ranh giới thửa khác | Từng trường hợp bị từ chối; không tạo bản ghi lỗi | R·I |
| F1-06 | Thử diện tích/giá không hợp lệ và thay đổi ranh giới P3 đang `RENT` | Không lưu giá trị sai; ranh giới thửa đang thuê không được sửa | R·I |
| F1-07 | E gắn V1 hợp P1, lưu rồi reload | Quan hệ `plot_variety_compatibility` tồn tại; P1 hiển thị V1 trong danh sách giống hợp lệ | S·I |
| F1-08 | E bỏ V1 hoặc chọn V2 không có quan hệ phù hợp, xem từ luồng đặt thuê | Giống đã bỏ không còn chọn được; server vẫn từ chối V2 dù gửi request trực tiếp | R·I |
| F1-09 | A tạo giống mới với thời gian sinh trưởng và buffer xác định; E chọn giống đó cho thửa | Giống hiện trong catalogue, chu kỳ tối thiểu được dùng ở bước thuê | R·I |
| F1-10 | E tạo template T1 cho V1 với ít nhất hai bước theo thứ tự ngày; mở lại | Template gắn đúng V1, đủ bước, ngày/loại task/hướng dẫn không mất sau reload | S·I |
| F1-11 | Thiếu giống hoặc tạo bước trùng thứ tự/ngày không hợp lệ | Không có template sai hoặc bước trùng; lỗi hiển thị rõ. **Cần xác nhận rule validation này trong UI/API trước khi tự động hóa.** | R·I |
| F1-12 | A tạo/sửa D1 và D2, giá và trạng thái; xem lại catalogue | Tên, loại, giá, đơn vị và trạng thái lưu đúng; dịch vụ ngừng hoạt động không được bán mới | R·I |
| F1-13 | A sửa giá P1, bật công bố; C1 tìm P1 trên Marketplace và mở chi tiết | Chỉ một P1 xuất hiện, giá/diện tích/giống hợp lệ trùng dữ liệu nguồn | S·I |
| F1-14 | Tắt công bố P1; đưa P4 sang `MAINT`; lọc Marketplace | P1 ẩn; P4 không thể bắt đầu đặt thuê. Kiểm tra cả API nếu UI còn cache | R·I |
| F1-15 | C1/S/E thử mở trang quản trị và gửi API tạo/sửa/xóa Land/Plot | Client guard chuyển hướng; backend từ chối request trái quyền bằng JWT thật; không đổi dữ liệu | S·U |
| F1-16 | Sau công bố, A sửa thông tin P1; mở Marketplace ở phiên khác rồi reload | Thông tin mới đồng bộ; không hiển thị giá cũ từ localStorage/mock fallback | R·I |

## 3. Luồng 2 — Khách thuê và đặt dịch vụ

**Mục tiêu:** C1 chọn thửa/giống/hình thức canh tác, giữ chỗ, thanh toán mock và nhận hợp đồng; các trường hợp sai không tạo hợp đồng hợp lệ.

| ID | Case / hành động | Kết quả cần kiểm tra | Mức |
| --- | --- | --- | --- |
| F2-01 | Khách lọc thửa khả dụng, mở P2 và xem giá, diện tích, giống | Bộ lọc, bản đồ và trang chi tiết cùng chỉ về P2; dữ liệu khớp API | S·U |
| F2-02 | Khách vãng lai đặt lịch tham quan ca hợp lệ rồi A xác nhận | Lịch xuất hiện đúng ca/trạng thái; khách không cần thuê trước | R·I |
| F2-03 | Đặt lịch quá khứ/thiếu họ tên hoặc số điện thoại; xác nhận lịch đã hủy | Không tạo lịch hoặc không chuyển trạng thái sai | R·I |
| F2-04 | C1 hỏi Expert trước thuê rồi tiếp tục chọn P2 | Nội dung tư vấn thấy ở đúng hai phía; không khóa thửa chỉ vì mở chat | R·I |
| F2-05 | Khách chưa đăng nhập bấm đặt P2; đăng nhập bằng JWT C1 | Trở lại đúng bước đặt P2, không mất lựa chọn hợp lệ | S·U |
| F2-06 | C1 chọn P2+V1, `SELF`, ngày bắt đầu T+5 và kỳ thuê đủ dài | Tóm tắt đúng thửa/giống/ngày/giá; chỉ tạo một hợp đồng `PENDING_PAYMENT` và rental `PENDING` | S·I |
| F2-07 | C1 chọn `ASSISTED` và D2 thay vì `SELF` | Phần phí chăm sóc thêm đúng; cấu hình và tổng tiền lưu đúng trong hợp đồng | S·I |
| F2-08 | C1 đặt hai thửa trong một hợp đồng, khác giống/kỳ thuê/hình thức | Hai rental độc lập cùng contract; tổng tiền bằng tổng từng thửa và dịch vụ | R·I |
| F2-09 | Thiếu thửa/giống/hình thức hoặc ngày kết thúc ≤ ngày bắt đầu | Nút tiếp tục bị chặn hoặc server trả lỗi; không có hợp đồng/rental mới | R·I |
| F2-10 | Thử ngày bắt đầu T+4, T+5, T+14, T+15; thử thời gian thuê ngắn hơn `expectedDuration + bufferTime` | T+5 và T+14 được chấp nhận; T+4 và T+15 bị từ chối, không tạo hợp đồng; thời lượng thuê thiếu bị từ chối với lý do rõ | R·I |
| F2-11 | Chọn V2 không hợp P2; thử sửa payload gửi trực tiếp | UI không cho chọn; backend trả lỗi BR03; không giữ chỗ | R·U |
| F2-12 | Chọn P3/P4, thửa chưa công bố, hoặc kỳ thuê chồng lịch P5 | Không tạo reservation; không có hai hợp đồng đang giữ cùng lịch cho cùng thửa | R·I |
| F2-13 | Hai khách C1/C2 đồng thời giữ P2 cùng kỳ | Tối đa một yêu cầu thành công; khách còn lại nhận lỗi xung đột; không có double booking | R·I |
| F2-14 | Tạo giữ chỗ, kiểm tra hạn 15 phút; chuyển thanh toán một lần | Hạn mới tăng đúng 10 phút; lần cộng thứ hai bị từ chối; trang hiển thị thời gian nhất quán server | R·I |
| F2-15 | Cho giữ chỗ hết hạn bằng đồng hồ test/tác vụ nền | Hợp đồng/rental chờ bị hủy; P2 đặt lại được; thanh toán sau hạn không kích hoạt hợp đồng | R·I |
| F2-16 | Dùng payment mock trả `SUCCESS` cho đúng tổng tiền | Chỉ một giao dịch thành công; hợp đồng `ACTIVE`, rental `CONFIRMED/ACTIVE` theo ngày, C1 thấy mã hợp đồng và các thửa | S·I |
| F2-17 | Mock `FAILED`, người dùng hủy thanh toán hoặc callback thiếu/chữ ký sai | Không kích hoạt hợp đồng; trạng thái lỗi rõ; không ghi doanh thu thành công | R·I |
| F2-18 | Gửi lại callback thanh toán thành công hoặc refresh trang return | Không tạo giao dịch/hợp đồng thứ hai; trạng thái cuối giữ nguyên | R·I |
| F2-19 | C2 xem contract của C1 bằng URL/API ID; Staff/Expert vào checkout | Không thấy dữ liệu hợp đồng của C1; Staff/Expert bị chặn checkout cả UI và backend | S·U |
| F2-20 | C1 mua D1 cho rental đã thanh toán; A phân công S | Tạo đúng một service request và task liên kết; lịch/người nhận/giá nhất quán; không tạo task trùng | R·I |
| F2-21 | Yêu cầu dịch vụ không thuộc rental C1 hoặc đã ngừng hoạt động | Không tạo order/task, không trừ tiền, báo lý do | R·I |
| F2-22 | C1 xem hợp đồng, tải lại trang, mở từng thửa | Mã hợp đồng, tiền, thời hạn, chế độ chăm sóc và trạng thái khớp bản ghi server | S·I |
| F2-23 | C1 yêu cầu hủy trước ngày bắt đầu; A duyệt/từ chối; thử gửi trùng | Chỉ một yêu cầu chờ; duyệt cập nhật hợp đồng/rental/thửa, từ chối không hủy; tiền hoàn tính theo **chính sách đã chốt** | R·I |
| F2-24 | C1 gia hạn rental còn hiệu lực trước hạn ≥3 ngày; thử sát hạn, trùng lịch, V2 không hợp, kỳ quá ngắn | Trường hợp hợp lệ tạo rental gia hạn đúng tiền/lịch; các trường hợp sai bị từ chối | R·I |

## 4. Luồng 3 — Canh tác đến nhận nông sản

**Mục tiêu:** theo dõi hai chế độ canh tác, IoT, task, nhật ký, sự cố, thu hoạch và nghiệm thu liên role.

| ID | Case / hành động | Kết quả cần kiểm tra | Mức |
| --- | --- | --- | --- |
| F3-01 | Mở rental `SELF` và `ASSISTED` ở C1 | Giao diện hiển thị đúng chế độ, thửa, giống và lịch; không lẫn dữ liệu hai rental | S·U |
| F3-02 | C1 xem quy trình V1 và bước T1 theo thửa | Bước đúng thứ tự/ngày; khách chỉ xem, không sửa template | R·U |
| F3-03 | Đưa rental `ASSISTED` tới ngày bắt đầu bằng clock test/scheduler | Rental thành `ACTIVE`; task từ T1 sinh một lần với ngày hạn, thửa và rental đúng | S·I |
| F3-04 | A giao task cho S; đăng nhập S và một Staff khác | S thấy task của mình; Staff khác không xem/sửa/hoàn thành task đó | S·I |
| F3-05 | S bắt đầu task, tải ảnh minh chứng, ghi chú rồi hoàn thành | Task `DONE`, ảnh/ghi chú lưu bền; một bài nhật ký liên kết task xuất hiện ở C1 | S·I |
| F3-06 | S hoàn thành task không ảnh, ảnh sai định dạng/quá kích thước hoặc submit lặp | Không đánh dấu `DONE` khi thiếu minh chứng; không có diary trùng; quy tắc kích thước/định dạng cần xác nhận | R·I |
| F3-07 | Đưa task quá hạn 23:59 bằng clock/scheduler | Trạng thái quá hạn và danh sách điều phối Admin nhất quán; không đổi task đã `DONE` | R·I |
| F3-08 | C1 ở `SELF` thêm ghi chú/ảnh vào nhật ký; Staff hoàn thành task `ASSISTED` | Phân biệt bài khách tự ghi với bài tự đồng bộ; dữ liệu đúng rental, ảnh còn sau reload | R·I |
| F3-09 | C1 xem cảm biến/biểu đồ lịch sử cho P2 | Giá trị, đơn vị, thời điểm và thửa khớp API; có trạng thái rỗng/kết nối lỗi rõ | S·U |
| F3-10 | Seed cảm biến vượt ngưỡng đủ thời gian; so `SELF` và `ASSISTED` | Cảnh báo đúng thửa; hành động theo mode đúng với runtime đã chốt; không sinh cảnh báo trùng cho cùng đợt | R·I |
| F3-11 | Mô phỏng mưa lớn/ẩm đất cao rồi kiểm tra task tưới | Task tưới được hoãn hoặc gắn cảnh báo theo rule được duyệt; task khác giữ nguyên | R·I |
| F3-12 | S gửi issue kèm thửa, mô tả, ảnh; E chẩn đoán và phân công xử lý | Issue đi qua các trạng thái hợp lệ; E/S thấy cùng issue và task liên kết; C1 chỉ thấy phần được phép | S·I |
| F3-13 | Issue thiếu thửa/mô tả/ảnh; người không được phân công cố xử lý | Không lưu issue thiếu dữ liệu bắt buộc; role lạ bị backend từ chối | R·I |
| F3-14 | C1 nhắn E; S nhắn E về issue; C1 thử liên hệ trực tiếp S | Thread phân vai đúng, chỉ người liên quan đọc được; C1 không có đường chỉ đạo trực tiếp S | R·I |
| F3-15 | C1 ở `SELF` đặt dịch vụ chăm sóc phát sinh, A giao S, S hoàn thành | Service request/task/nhật ký cùng tham chiếu một rental; thanh toán chỉ qua mock | R·I |
| F3-16 | C1 lên kế hoạch thu hoạch, chọn ngày/phương thức; E xét duyệt | Kế hoạch xuất hiện ở E, trạng thái thay đổi một lần, C1 nhìn thấy kết quả và lý do từ chối nếu có | S·I |
| F3-17 | S chọn đúng thửa, ảnh, khối lượng >0 và xác nhận rồi ghi nhận thu hoạch | Một `harvest_result` gắn rental/S, kg và ảnh đúng; nhật ký thu hoạch được tạo | S·I |
| F3-18 | S bỏ thửa/ảnh/khối lượng/xác nhận, kg ≤0 hoặc submit lặp | Form/API không tạo harvest sai hoặc trùng; không có diary thu hoạch trùng | R·I |
| F3-19 | C1 chọn nhận tại vườn (`PICKUP`) hoặc giao hàng (`DELIVERY`), nghiệm thu và đánh giá | Loại giao nhận, xác nhận, rating/feedback lưu đúng; chỉ C1 sở hữu rental được xác nhận | S·I |
| F3-20 | C2 xác nhận thu hoạch của C1; C1 xác nhận lặp/đánh giá ngoài thang | Backend từ chối/giữ một kết quả hợp lệ, không ghi đè trái phép | R·I |
| F3-21 | Đưa rental qua End Date bằng scheduler | Rental `DONE`, contract `COMPLETED` khi mọi rental đã xong, plot `MAINT`; lịch sử còn xem được | R·I |
| F3-22 | Sau nghỉ đất 4 ngày, thử đặt lịch trong và sau thời gian bảo dưỡng | Trong kỳ bảo dưỡng không đặt được; sau kỳ chỉ đặt được khi thửa đã `AVAIL` và công bố | R·I |
| F3-23 | C1/S/E truy cập dữ liệu thửa, issue, chat và task không thuộc mình qua URL/API | Không lộ dữ liệu và không đổi trạng thái; chỉ role được phân công thao tác được | S·U |

## 5. Luồng 4 — Đo hiệu quả kinh doanh

**Mục tiêu:** Admin xem số thực thu, doanh thu thuê/dịch vụ, lấp đầy và hiệu suất công việc từ cùng một tập giao dịch/dữ liệu vận hành.

| ID | Case / hành động | Kết quả cần kiểm tra | Mức |
| --- | --- | --- | --- |
| F4-01 | A mở dashboard với LEDGER cố định, tải lại | KPI đến từ API/DB test, không phải số demo hardcode; thời điểm cập nhật rõ | S·I |
| F4-02 | Đối chiếu tổng `SUCCESS` với `PENDING`/`FAILED` | Chỉ giao dịch thành công tính vào doanh thu; pending/failed hiển thị riêng, không cộng nhầm | S·I |
| F4-03 | Đối chiếu doanh thu thuê đất và dịch vụ | Hai nhóm cộng đúng theo `contract_id`/`service_request_id`; không đếm hai lần giao dịch liên kết cả hai | S·I |
| F4-04 | Seed giao dịch `REFUND`/hủy hợp đồng | KPI thực thu hiển thị theo định nghĩa gross/net đã duyệt; bút toán hoàn không bị cộng như doanh thu mới | R·I |
| F4-05 | Seed giao dịch hai tháng khác nhau, sát ranh giới múi giờ | Biểu đồ tháng và tổng tháng khớp ledger theo Asia/Bangkok hoặc múi giờ được chốt | R·I |
| F4-06 | Đối chiếu `totalPlots`, `RENT`, `AVAIL`, `MAINT` | Tổng trạng thái không thiếu/trùng; tỷ lệ lấp đầy = thửa `RENT` / tổng thửa theo định nghĩa được duyệt | S·I |
| F4-07 | Database test chưa có plot hoặc transaction | UI hiển thị 0/trạng thái rỗng, không NaN/Infinity và không hiện số mẫu | R·I |
| F4-08 | Đối chiếu task `PENDING`, `IN_PROG`, `DONE` và tỷ lệ hoàn thành | Các count/tỷ lệ đúng theo dữ liệu task; task quá hạn được phân loại rõ | R·I |
| F4-09 | Mở giao dịch gần đây rồi đối chiếu mã, ngày, số tiền, trạng thái | Mỗi dòng khớp ledger, chỉ hiện giới hạn bản ghi đã thiết kế; không lộ dữ liệu ngoài quyền | R·I |
| F4-10 | Hoàn tất F2 payment mock và F3 task, reload dashboard | KPI doanh thu/plot/task thay đổi đúng một lần; không cần hard reload nếu UI có refresh/polling | R·I |
| F4-11 | C1/S/E/anonymous mở `/admin/dashboard` và API analytics trực tiếp | Không thấy số liệu quản trị; backend trả 401/403 cho role không được phép | S·U |
| F4-12 | API analytics lỗi hoặc trả dữ liệu không đủ trường | UI báo không tải được/placeholder rõ; **không trình bày số mẫu như số thực** | R·U |
| F4-13 | Xem quyết định mùa vụ tiếp theo | Nếu hệ thống chỉ có KPI mà chưa có thao tác ghi quyết định/kế hoạch, dừng ở kiểm tra thông tin; không tự giả định đã lưu quyết định | R·U |

## 6. Điểm cần chốt trước khi chuyển thành Playwright

1. **DB và runtime:** `docker-compose.yml` hiện mặc định DB `farmely`. Cần DB test khác tên, cấu hình riêng cho Spring **và** Vite plugin. Chọn kiểm thử `localhost:3000` với Vite plugin, hoặc bản deploy qua Gateway; nếu cần cả hai, lập hai bộ kỳ vọng tương ứng.
2. **Quy tắc có chênh lệch tài liệu/code:** tài liệu yêu cầu hoàn tiền theo mốc thời gian, nhưng `ContractCancellationServiceImpl` chủ yếu ghi yêu cầu và đổi trạng thái; tỷ lệ hoàn tiền cần đối chiếu Vite plugin. Các BR cũ còn mô tả mô hình reservation/plan khác schema hiện tại. Case chỉ PASS khi hành vi đã chốt được chứng minh, không sửa kỳ vọng để chiều theo UI.
3. **Báo cáo kinh doanh:** `AdminDashboard.jsx` có KPI và biểu đồ fallback hardcode khi analytics không trả dữ liệu. `siteVisitsApiPlugin.js` tính doanh thu từ `payment_transactions` có `status=SUCCESS`, nên cần chốt **gross/net** và cách xử lý `REFUND` trước khi viết assertion tiền.
4. **Dữ liệu demo và backend:** nhiều dashboard có fallback trong React/localStorage, trong khi plugin dùng SQL và Spring có logic riêng. Test E2E phải xác nhận dữ liệu tồn tại sau reload và qua role khác; chỉ nhìn thấy toast hoặc card demo chưa đủ PASS.
5. **Thu hoạch và giao nhận:** API thu hoạch cho lưu kg/ảnh và xác nhận của khách. Chưa thấy một workflow vận chuyển độc lập hay chứng từ giao nhận; case F3-19 chỉ kiểm tra lựa chọn `PICKUP/DELIVERY`, xác nhận và đánh giá. Nếu cần theo dõi shipper/trạng thái giao hàng, đó là gap sản phẩm.
6. **Thời lượng trong ảnh:** 3/6/7/4 phút là thời gian trình diễn, không phải timeout chức năng. Case đồng hồ 15/10 phút, quá hạn task và nghỉ đất phải dùng clock/tác vụ nền có kiểm soát.

## 7. Thứ tự triển khai sau khi duyệt

**Pha A — smoke xuyên luồng:** F1-01/04/07/10/13 → F2-01/05/06/07/16/22 → F3-01/03/04/05/09/12/16/17/19 → F4-01/02/03/06/11. Chạy từng nhóm nhỏ, sửa lỗi test trước nhóm kế tiếp.

**Pha B — regression nghiệp vụ:** các case còn lại theo thứ tự đặt thuê và thanh toán → task/thu hoạch → analytics → biên và đồng thời. Mỗi test có dữ liệu riêng, assertion ở UI và API/DB test, trace khi lỗi; không dùng `waitForTimeout` để chờ lịch/scheduler.

**Điều kiện bàn giao:** report liệt kê PASS/FAIL/BLOCKED theo ID, số case chạy, lý do FAIL, mức bao phủ theo từng luồng/role, và danh sách chức năng còn chưa kiểm thử. Không tuyên bố “full coverage” chỉ vì các test đã viết đều PASS.
