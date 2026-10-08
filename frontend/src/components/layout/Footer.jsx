import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-16 pb-8 border-t border-brand-green/30 relative overflow-hidden">
      {/* Subtle organic background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-light/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
                <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
              </div>
              <span className="font-heading text-2xl font-black tracking-wider text-white">
                FARMELY
              </span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed max-w-sm">
              Nền tảng công nghệ quản lý và vận hành mô hình thuê đất nông nghiệp đô thị khép kín. Trải nghiệm tự tay gieo mầm, giám sát bằng trạm IoT vi khí hậu và thu hoạch nông sản chuẩn VietGAP.
            </p>
            <div className="pt-2 text-xs text-brand-yellow flex items-center gap-2 font-medium">
              <span>Đề tài đồ án ISP392 – FPT University</span>
            </div>
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
              <li>
                <a href="/#how-it-works" className="hover:text-brand-yellow transition-colors">Quy trình 4 bước</a>
              </li>
              <li>
                <a href="/#experience" className="hover:text-brand-yellow transition-colors">Hình thức canh tác</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Master Data / Dành cho Quản lý */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider text-xs">
              Quản Trị Master Data
            </h4>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>
                <Link to="/admin/master-data" className="hover:text-brand-yellow transition-colors">Tổng quan Master Data</Link>
              </li>
              <li>
                <Link to="/admin/master-data/lands" className="hover:text-brand-yellow transition-colors">Quản lý Nông Trại (Land)</Link>
              </li>
              <li>
                <Link to="/admin/master-data/plots" className="hover:text-brand-yellow transition-colors">Quản lý Thửa Đất (Plot)</Link>
              </li>
              <li>
                <Link to="/admin/master-data/iot-stations" className="hover:text-brand-yellow transition-colors">Trạm Cảm Biến IoT</Link>
              </li>
              <li>
                <Link to="/admin/master-data/process-templates" className="hover:text-brand-yellow transition-colors">Quy Trình Chuẩn VietGAP</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Liên hệ & Hỗ trợ */}
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
        <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© 2026 Farmely Platform. Bản quyền thuộc về Đội ngũ phát triển ISP392.</p>
          <div className="flex items-center gap-1">
            <span>Được thiết kế với tình yêu nông nghiệp bền vững</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>

      </div>
    </footer>
  );
}
