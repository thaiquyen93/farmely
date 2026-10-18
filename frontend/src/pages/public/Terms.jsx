import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 sm:px-8">
        <article className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-green">Farmely</p>
          <h1 className="mt-2 font-heading text-3xl font-black">Điều khoản thuê đất và thanh toán</h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted">Các điều khoản này áp dụng cho việc đặt thuê thửa đất, lựa chọn hình thức canh tác và sử dụng dịch vụ chăm sóc trên nền tảng Farmely.</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700">
            <section><h2 className="font-heading text-lg font-black text-brand-dark">1. Xác nhận thông tin thuê</h2><p>Khách hàng chịu trách nhiệm kiểm tra thửa đất, thời hạn thuê, giống cây, hình thức canh tác và tổng chi phí trước khi thanh toán.</p></section>
            <section><h2 className="font-heading text-lg font-black text-brand-dark">2. Thanh toán</h2><p>Đơn thuê chỉ được ghi nhận sau khi giao dịch được cổng thanh toán xác nhận thành công. Farmely lưu mã giao dịch để phục vụ đối soát.</p></section>
            <section><h2 className="font-heading text-lg font-black text-brand-dark">3. Hủy và hoàn tiền</h2><p>Hoàn 80% khi hủy trước ngày bắt đầu ít nhất 3 ngày; hoàn 50% nếu hủy trong vòng 3 ngày trước ngày bắt đầu. Các chi phí đã phát sinh thực tế có thể được khấu trừ.</p></section>
            <section><h2 className="font-heading text-lg font-black text-brand-dark">4. Quy chuẩn canh tác</h2><p>Hoạt động tại thửa đất phải tuân thủ quy trình VietGAP, hướng dẫn kỹ thuật và quy định an toàn của nông trại. Không sử dụng vật tư chưa được Farmely phê duyệt.</p></section>
            <section><h2 className="font-heading text-lg font-black text-brand-dark">5. Dịch vụ chăm sóc</h2><p>Khách hàng có thể xem danh mục dịch vụ trước khi thuê đất. Việc đặt dịch vụ cho một thửa cụ thể chỉ được thực hiện khi khách hàng có lượt thuê hợp lệ.</p></section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
