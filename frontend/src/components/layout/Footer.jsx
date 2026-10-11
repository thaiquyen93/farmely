import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-10 pb-6 border-t border-brand-green/30 relative overflow-hidden">
      {/* Subtle organic background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-light/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
                <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
              </div>
              <span className="font-heading text-2xl font-black tracking-wider text-white">
                FARMELY
              </span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed max-w-sm">
              Nền tảng thuê thửa đất và theo dõi trải nghiệm canh tác. Trải nghiệm tự tay canh tác hoặc ủy thác trọn gói, giám sát bằng trạm quan trắc IoT vi khí hậu và thu hoạch nông sản chuẩn VietGAP.
            </p>
          </div>

          {/* Col 2: Liên kết nhanh */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider text-xs">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>
                <Link to="/" className="hover:text-brand-yellow transition-colors">Trang chủ</Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-brand-yellow transition-colors">Marketplace</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-yellow transition-colors">Về Farmely</Link>
              </li>
              <li><a href="/#how-it-works" className="hover:text-brand-yellow transition-colors">Quy trình hoạt động</a></li>
            </ul>
          </div>

          {/* Col 3: Liên hệ & Hỗ trợ */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider text-xs">
              Liên Hệ Trang Trại
            </h4>
            <div className="space-y-2.5 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <span>Khu quy hoạch Nông nghiệp Công nghệ cao, Củ Chi & TP. Thủ Đức, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-yellow shrink-0" />
                <span className="font-semibold text-white">1900 688 889 (08:00 - 17:00)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-yellow shrink-0" />
                <span>support@farmely.vn</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 text-center text-xs text-stone-400">
          <p>© 2026 Farmely. Nông nghiệp thông minh, minh bạch và bền vững.</p>
        </div>

      </div>
    </footer>
  );
}
