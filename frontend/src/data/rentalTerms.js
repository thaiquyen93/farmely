export const RENTAL_TERMS_VERSION = 'FARMELY-LEASE-2026-11-04-DRAFT';

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
  representative: 'Nguyễn Văn Hoàng',
  position: 'Giám đốc Điều hành (CEO)'
};
export const RENTAL_TERMS = [
  {
    title: 'Điều 1. Phạm vi và đối tượng giao dịch',
    content: 'Điều khoản này điều chỉnh việc khách hàng đặt thuê thửa đất nông nghiệp, đăng ký cây trồng, chọn ngày bắt đầu canh tác và lựa chọn dịch vụ chăm sóc trên nền tảng Farmely. Farmely chỉ xác nhận giao dịch đối với thửa đất, thời hạn và dịch vụ hiển thị trong đơn đặt thuê.'
  },
  {
    title: 'Điều 2. Thông tin thửa đất và thời hạn canh tác',
    content: 'Khách hàng kiểm tra mã thửa, diện tích, cây trồng, hình thức chăm sóc, ngày bắt đầu và ngày kết thúc của từng thửa trước khi thanh toán. Ngày bắt đầu được chọn trong khoảng từ 5 đến 14 ngày sau ngày đặt thuê để Farmely chuẩn bị đất, vật tư và kế hoạch vận hành. Thời hạn thuê tối thiểu phải đáp ứng chu kỳ sinh trưởng của giống đã chọn cộng thêm 10 ngày dự phòng.'
  },
  {
    title: 'Điều 3. Mục đích sử dụng và quy trình canh tác',
    content: 'Thửa đất chỉ được dùng cho mục đích canh tác đã đăng ký. Khách hàng không tự ý thay đổi cây trồng, dùng vật tư ngoài danh mục được chấp thuận, chuyển giao quyền sử dụng hoặc thực hiện hoạt động có thể gây thiệt hại cho đất, hệ thống tưới, thiết bị kỹ thuật hay các thửa lân cận.'
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
    content: 'Yêu cầu hủy hợp đồng và hoàn tiền phải được gửi trước ngày bắt đầu thuê; trong đó, khách hàng được hoàn lại 80% số tiền đã thanh toán nếu yêu cầu trước ít nhất 3 ngày, hoàn lại 50% nếu gửi trước dưới 3 ngày, và sẽ không được hoàn tiền từ ngày bắt đầu thuê trở đi.'
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
  },
  {
    title: 'Điều 10. Hủy hợp đồng và hoàn tiền',
    content: 'Khách hàng gửi yêu cầu hủy trên hệ thống trước ngày bắt đầu canh tác sớm nhất trong hợp đồng. Gửi trước ngày bắt đầu từ 3 ngày trở lên: hoàn 80% số tiền đã thanh toán. Gửi trước ngày bắt đầu dưới 3 ngày: hoàn 50%. Từ ngày bắt đầu trở đi: không hoàn tiền. Yêu cầu cần được quản trị viên duyệt; mức hoàn cuối cùng được hiển thị trong kết quả xử lý yêu cầu.'
  },
  {
    title: 'Điều 11. Gia hạn và kết thúc thuê',
    content: 'Khách hàng gửi yêu cầu gia hạn trước ngày kết thúc hợp đồng ít nhất 3 ngày. Việc gia hạn phụ thuộc vào khả năng tiếp tục cung cấp plot và xác nhận thanh toán. Nếu không gia hạn, khi hết hợp đồng plot được chuyển sang bảo dưỡng 4 ngày để vệ sinh, xử lý đất và chuẩn bị cho lượt canh tác tiếp theo; trong thời gian này plot chưa mở cho lượt thuê mới.'
  },
  {
    title: 'Điều 12. Hình thức canh tác và dịch vụ chăm sóc',
    content: 'Khách hàng chọn tự canh tác hoặc Farmely chăm sóc cho từng plot. Với hình thức tự canh tác, khách hàng thực hiện công việc theo quy trình của giống đã chọn và ghi nhật ký theo yêu cầu hiển thị trên hệ thống. Với hình thức Farmely chăm sóc, nhân viên được phân công thực hiện các công việc theo quy trình canh tác và cập nhật nhật ký, minh chứng. Dịch vụ chăm sóc phát sinh riêng chỉ áp dụng theo nội dung, thời gian và mức phí được hiển thị trước khi khách hàng đặt.'
  },
  {
    title: 'Điều 13. Giống cây, thời hạn và quy trình canh tác',
    content: 'Khách hàng chỉ chọn giống tương thích và được Farmely cung cấp cho plot. Thời hạn thuê tối thiểu phải đáp ứng chu kỳ sinh trưởng cùng khoảng dự phòng được hiển thị khi cấu hình đơn. Khách hàng không tự ý thay giống, dùng vật tư chưa được chấp thuận hoặc thực hiện hoạt động gây ảnh hưởng đến đất, hệ thống tưới, thiết bị và các plot lân cận. Các mốc công việc, hướng dẫn và vật tư áp dụng theo quy trình canh tác của giống đã xác nhận trong đơn.'
  },
  {
    title: 'Điều 14. Đặt giữ plot và thanh toán',
    content: 'Khi bắt đầu đặt thuê, hệ thống giữ plot trong 15 phút và có thể cộng thêm 10 phút ân hạn khi khách hàng chuyển sang thanh toán. Khách hàng thanh toán 100% tổng giá trị đơn, gồm tiền thuê và dịch vụ đã chọn; hệ thống không thu tiền đặt cọc. Hợp đồng chỉ được kích hoạt sau khi hệ thống xác nhận giao dịch thanh toán thành công. Nếu thời gian giữ chỗ hết hạn trước khi hoàn tất, plot có thể được mở lại cho khách hàng khác.'
  },
  {
    title: 'Điều 15. Sản lượng và điều kiện tự nhiên',
    content: 'Kết quả và sản lượng phụ thuộc vào giống, thời tiết, sâu bệnh, điều kiện tự nhiên và việc tuân thủ quy trình canh tác; Farmely không cam kết sản lượng cố định. Farmely ghi nhận và thông báo các sự cố vận hành trong phạm vi dịch vụ đã chọn. Các bên phối hợp xử lý sự kiện bất khả kháng theo thỏa thuận và quy định pháp luật.'
  }
];
