import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck2, ShieldCheck } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const sections = [
  ['1. Phạm vi áp dụng', 'Điều khoản này áp dụng cho việc đặt thuê thửa đất, lựa chọn hình thức canh tác và sử dụng các dịch vụ chăm sóc trên nền tảng Farmely.'],
  ['2. Thông tin hợp đồng', 'Khách hàng có trách nhiệm kiểm tra đúng mã thửa, diện tích, thời hạn thuê, cây trồng, hình thức canh tác và tổng chi phí trước khi xác nhận thanh toán.'],
  ['3. Thanh toán và kích hoạt', 'Hợp đồng được ghi nhận sau khi giao dịch được xác nhận thành công. Giá trị thanh toán, phương thức thanh toán và mã giao dịch được lưu cùng hồ sơ hợp đồng.'],
  ['4. Quyền sử dụng thửa đất', 'Khách hàng sử dụng thửa đất đúng mục đích canh tác đã đăng ký, tuân thủ quy trình an toàn của nông trại và không tự ý sử dụng vật tư ngoài danh mục được chấp thuận.'],
  ['5. Dịch vụ chăm sóc', 'Dịch vụ lẻ và gói chăm sóc được thực hiện theo phạm vi, lịch dự kiến và đơn vị tính hiển thị tại thời điểm đặt. Kết quả thực hiện có thể kèm nhật ký và ảnh minh chứng hiện trường.'],
  ['6. Thay đổi, hủy và hoàn tiền', 'Yêu cầu thay đổi hoặc hủy hợp đồng được xử lý theo trạng thái hợp đồng và thời điểm gửi yêu cầu. Mức hoàn tiền cụ thể được hiển thị trong phần tổng kết trước thanh toán.'],
  ['7. Thu hoạch và bàn giao', 'Sản lượng phụ thuộc điều kiện tự nhiên và quá trình canh tác. Farmely ghi nhận khối lượng, tình trạng nông sản và phương thức nhận hàng khi kết thúc vụ.'],
  ['8. Dữ liệu và thông báo', 'Farmely sử dụng thông tin tài khoản, hợp đồng, thanh toán và vận hành thửa đất để cung cấp dịch vụ, gửi thông báo cần thiết và hỗ trợ giải quyết yêu cầu.'],
  ['9. Xác nhận điện tử', 'Việc đánh dấu ô chấp nhận và tiếp tục thanh toán được xem là xác nhận của khách hàng đối với nội dung đơn hàng và các điều khoản đang hiển thị.']
];

export default function RentalTerms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-brand-cream">
      <PublicNavbar />
      <header className="bg-brand-dark pb-12 pt-28 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-brand-yellow hover:underline"><ArrowLeft className="h-4 w-4" /> Quay lại trang thanh toán</button>
          <div className="mt-6 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow"><FileCheck2 className="h-6 w-6" /></span>
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Farmely</p><h1 className="mt-1 font-heading text-3xl font-black sm:text-4xl">Điều khoản thuê đất và sử dụng dịch vụ</h1><p className="mt-2 text-sm text-white/70">Áp dụng cho giao dịch đặt thuê thửa đất và dịch vụ canh tác trên Farmely.</p></div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Vui lòng đọc kỹ toàn bộ nội dung trước khi xác nhận. Điều khoản tại thời điểm thanh toán sẽ được áp dụng cho đơn đặt thuê tương ứng.</p></div>
          <div className="space-y-7">
            {sections.map(([title, content]) => <section key={title}><h2 className="font-heading text-lg font-black text-brand-dark">{title}</h2><p className="mt-2 text-sm leading-7 text-stone-600">{content}</p></section>)}
          </div>
          <div className="mt-10 border-t border-brand-border pt-6 text-xs text-brand-muted">Cập nhật lần cuối: 13/10/2026</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
