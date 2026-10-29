export const RENTAL_TERMS_VERSION = 'FARMELY-LEASE-2026-10-27-DRAFT';

/**
 * THÔNG TIN PHÁP LÝ & ĐẠI DIỆN BÊN CHO THUÊ (BÊN A) - CÔNG TY TNHH FARMELY
 * Bạn có thể trực tiếp chỉnh sửa thông tin công ty, trụ sở, mã số thuế, hotline,
 * người đại diện tại đây để hiển thị trên toàn bộ các hợp đồng điện tử của hệ thống.
 */
export const FARMELY_COMPANY_INFO = {
  companyName: 'CÔNG TY TNHH FARMELY',
  headquarters: 'Khu Công nghệ cao TP.HCM, Phường Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
  farmAddress: 'Trang trại Farmely Củ Chi, Đường Bến Than, Xã Hòa Phú, Huyện Củ Chi, TP. Hồ Chí Minh',
  taxCode: '0318998899',
  phone: '1900 688 889',
  hotline: '0988 123 456',
  email: 'support@farmely.vn',
  website: 'https://farmely.vn',
  representative: 'Lương Văn Hoàng',
  position: 'Giám đốc Điều hành (CEO)'
};
export const RENTAL_TERMS = [
  {
    title: 'Điều 1. Phạm vi và đối tượng giao dịch',
    content: 'Điều khoản này điều chỉnh việc khách hàng đặt thuê thửa đất nông nghiệp, đăng ký cây trồng, chọn ngày bắt đầu canh tác và lựa chọn dịch vụ chăm sóc trên nền tảng Farmely. Farmely chỉ xác nhận giao dịch đối với thửa đất, thời hạn và dịch vụ hiển thị trong đơn đặt thuê.'
  },
  {
    title: 'Điều 2. Thông tin thửa đất và thời hạn canh tác',
    content: 'Khách hàng kiểm tra mã thửa, diện tích, cây trồng, hình thức chăm sóc, ngày bắt đầu và ngày kết thúc của từng thửa trước khi thanh toán. Ngày bắt đầu phải từ 10 ngày sau ngày đặt thuê; Farmely dùng khoảng thời gian này để chuẩn bị đất, vật tư và kế hoạch vận hành.'
  },
  {
    title: 'Điều 3. Mục đích sử dụng và quy trình canh tác',
    content: 'Thửa đất chỉ được dùng cho mục đích canh tác đã đăng ký. Khách hàng không tự ý thay đổi cây trồng, dùng vật tư ngoài danh mục được chấp thuận, chuyển giao quyền sử dụng hoặc thực hiện hoạt động có thể gây thiệt hại cho đất, hệ thống tưới, thiết bị IoT hay các thửa lân cận.'
  },
  {
    title: 'Điều 4. Dịch vụ chăm sóc và nhật ký vận hành',
    content: 'Với gói Farmely hỗ trợ, phạm vi công việc, lịch dự kiến và chi phí là thông tin hiển thị trong đơn đặt thuê. Farmely ghi nhận các hoạt động vận hành, cảnh báo và minh chứng hiện trường trên hệ thống; các dữ liệu này là căn cứ theo dõi quá trình cung ứng dịch vụ.'
  },
  {
    title: 'Điều 5. Giá, thanh toán và hiệu lực',
    content: 'Khách hàng thanh toán toàn bộ giá trị được hiển thị trước khi tiếp tục. Hợp đồng được kích hoạt sau khi hệ thống xác nhận giao dịch thành công. Bản hợp đồng điện tử lưu trên Farmely phải thể hiện mã hợp đồng, các thửa đất, thời hạn canh tác, tổng giá trị và trạng thái giao dịch.'
  },
  {
    title: 'Điều 6. Thay đổi, hủy và hoàn tiền',
    content: 'Khách hàng gửi yêu cầu hủy toàn bộ hợp đồng trên hệ thống Farmely. Mức hoàn tiền dự kiến tính trên tổng số tiền đã thanh toán, theo ngày hệ thống ghi nhận yêu cầu so với ngày bắt đầu canh tác sớm nhất trong hợp đồng: gửi trước ít nhất 3 ngày thì hoàn 80%, khấu trừ 20%; gửi trước 1–2 ngày thì hoàn 50%, khấu trừ 50%; gửi vào hoặc sau ngày bắt đầu thì không hoàn tiền, khấu trừ 100%. Yêu cầu gửi thành công chỉ ở trạng thái chờ duyệt; hợp đồng và thửa đất chỉ chuyển sang trạng thái hủy sau khi quản trị viên phê duyệt. Farmely thông báo kết quả và số tiền hoàn được duyệt qua tài khoản hoặc kênh liên hệ đã đăng ký. Yêu cầu thay đổi ngày canh tác, cây trồng hoặc dịch vụ được xử lý theo trạng thái hợp đồng và chi phí đã phát sinh.'
  },
  {
    title: 'Điều 7. Sản lượng, rủi ro và sự kiện bất khả kháng',
    content: 'Sản lượng nông sản phụ thuộc giống cây, thời tiết, dịch bệnh, điều kiện tự nhiên và việc tuân thủ quy trình. Farmely không cam kết sản lượng cố định, nhưng có trách nhiệm thông báo sự cố vận hành trong phạm vi dịch vụ đã chọn. Các bên phối hợp xử lý sự kiện bất khả kháng theo pháp luật và khả năng thực tế.'
  },
  {
    title: 'Điều 8. Dữ liệu, thông báo và xác nhận điện tử',
    content: 'Farmely sử dụng dữ liệu tài khoản, đơn đặt thuê, thanh toán và vận hành thửa đất để thực hiện hợp đồng, gửi thông báo và giải quyết yêu cầu. Việc khách hàng mở toàn bộ điều khoản, tích xác nhận và tiếp tục thanh toán là bản ghi chấp thuận điện tử đối với phiên bản điều khoản được hiển thị.'
  },
  {
    title: 'Điều 9. Khiếu nại và giải quyết tranh chấp',
    content: 'Khách hàng gửi yêu cầu hỗ trợ hoặc khiếu nại qua kênh công bố trên Farmely kèm mã hợp đồng và tài liệu liên quan. Các bên ưu tiên trao đổi, đối chiếu dữ liệu hệ thống và thương lượng; nếu không giải quyết được thì thực hiện theo thỏa thuận hợp đồng và pháp luật Việt Nam.'
  }
];
