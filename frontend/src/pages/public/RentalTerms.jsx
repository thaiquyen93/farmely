import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck2, ShieldCheck } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { RENTAL_TERMS, RENTAL_TERMS_VERSION } from '../../data/rentalTerms';

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
            {RENTAL_TERMS.map(({ title, content }) => <section key={title}><h2 className="font-heading text-lg font-black text-brand-dark">{title}</h2><p className="mt-2 text-sm leading-7 text-stone-600">{content}</p></section>)}
          </div>
          <div className="mt-10 border-t border-brand-border pt-6 text-xs text-brand-muted">Phiên bản: {RENTAL_TERMS_VERSION} · Dự thảo chờ phê duyệt pháp lý trước khi áp dụng chính thức.</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
