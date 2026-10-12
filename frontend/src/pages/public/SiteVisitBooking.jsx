import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import SiteVisitForm from '../../components/public/SiteVisitForm';
import { Calendar, PhoneCall, ArrowLeft } from 'lucide-react';

export default function SiteVisitBooking() {
  const [searchParams] = useSearchParams();
  const plotId = searchParams.get('plotId');

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <PublicNavbar />

      {/* Header Banner */}
      <div className="pt-28 pb-12 bg-brand-dark text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs text-brand-yellow font-bold hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Sàn Thửa Đất (Marketplace)</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white">
            Đặt Lịch Khảo Sát Nông Trại
          </h1>
          <p className="text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
            Trực tiếp đặt chân lên cánh đồng, cảm nhận chất đất phù sa, kiểm tra nguồn nước và trải nghiệm trạm cảm biến IoT thực tế trước khi đưa ra quyết định canh tác.
          </p>
        </div>
      </div>

      {/* Main Booking Section */}
      <main className="flex-1 py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-2">
            <SiteVisitForm preselectedPlotId={plotId} />
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
              <h3 className="font-heading text-lg font-bold text-brand-dark flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-green" />
                Lưu Ý Khi Tham Quan
              </h3>
              
              <ul className="space-y-3 text-xs text-stone-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <span><strong>Tùy chọn tự do:</strong> Bạn hoàn toàn có thể thuê thửa đất trực tuyến mà không cần bắt buộc phải đi xem trực tiếp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <span><strong>Xác nhận chu đáo:</strong> Bạn chỉ cần để lại thông tin liên hệ, nhân viên Farmely sẽ gọi điện tư vấn và sắp xếp khung giờ thuận tiện nhất cho bạn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <span><strong>Trang phục khuyến nghị:</strong> Nên mặc trang phục thoải mái, nón rộng và giày đi bộ phù hợp với địa hình đồng ruộng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <span><strong>Miễn phí 100%:</strong> Buổi tham quan và trải nghiệm nước uống mát lành tại trang trại là hoàn toàn miễn phí.</span>
                </li>
              </ul>
            </div>

            <div className="bg-brand-cream/60 rounded-2xl p-6 border border-brand-border text-center space-y-2">
              <p className="text-xs font-bold text-brand-dark">Cần hỗ trợ hướng dẫn đường đi?</p>
              <p className="text-xs text-brand-muted">Liên hệ hotline hỗ trợ trực tiếp trang trại:</p>
              <p className="text-base font-heading font-extrabold text-brand-green">1900 688 889</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
