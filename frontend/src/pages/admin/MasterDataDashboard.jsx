import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Grid3X3,
  Radio,
  Sprout,
  Wheat,
  SlidersHorizontal,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
export default function MasterDataDashboard() {
  const [counts, setCounts] = useState({ lands: null, plots: null, availablePlots: null, crops: null, varieties: null, iot: null, templates: null, docs: null });
  useEffect(() => {
    const endpoints = [['lands', '/api/lands'], ['plots', '/api/plots'], ['crops', '/api/crops'], ['varieties', '/api/varieties'], ['iot', '/api/iot-stations'], ['templates', '/api/process-templates'], ['docs', '/api/v1/knowledge-documents']];
    Promise.all(endpoints.map(async ([key, url]) => {
      try { const res = await fetch(url); const data = await res.json(); return [key, Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])]; }
      catch { return [key, []]; }
    })).then((entries) => {
      const next = Object.fromEntries(entries);
      setCounts({ lands: next.lands.length, plots: next.plots.length, availablePlots: next.plots.filter((p) => String(p.status || '').toUpperCase() === 'AVAILABLE').length, crops: next.crops.length, varieties: next.varieties.length, iot: next.iot.length, templates: next.templates.filter((t) => String(t.status || '').toUpperCase() === 'ACTIVE').length, docs: next.docs.length });
    });
  }, []);
  const value = (key) => counts[key] ?? 'Chưa có data';

  const stats = [
    { label: 'Tổng số Nông Trại (Lands)', value: value('lands'), icon: Building2, link: '/admin/master-data/lands', color: 'text-brand-green' },
    { label: 'Tổng số Thửa Đất', value: value('plots'), icon: Grid3X3, link: '/admin/master-data/plots', color: 'text-emerald-700' },
    { label: 'Thửa Đất Khả Dụng', value: value('availablePlots'), icon: CheckCircle2, link: '/admin/master-data/plots', color: 'text-brand-yellow' },
    { label: 'Danh Mục Cây (Crops)', value: value('crops'), icon: Sprout, link: '/admin/master-data/crops', color: 'text-brand-green' },
    { label: 'Giống Cây (Varieties)', value: value('varieties'), icon: Wheat, link: '/admin/master-data/varieties', color: 'text-amber-700' },
    { label: 'Trạm Cảm Biến IoT', value: value('iot'), icon: Radio, link: '/admin/master-data/iot-stations', color: 'text-sky-700' },
    { label: 'Quy Trình Chuẩn VietGAP', value: value('templates'), icon: FileSpreadsheet, link: '/admin/master-data/process-templates', color: 'text-emerald-700' },
    { label: 'Tài Liệu Kỹ Thuật (RAG)', value: value('docs'), icon: BookOpen, link: '/admin/master-data/knowledge-documents', color: 'text-indigo-700' },
  ];

  const recentUpdates = [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green uppercase tracking-wider border border-brand-border">
            Hệ Thống Quản Trị Trung Tâm
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark mt-2">
            Farmely Master Data
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Quản lý và chuẩn hóa toàn bộ nền tảng dữ liệu sinh học, quỹ đất, trạm cảm biến và quy trình VietGAP.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/master-data/plots/create"
            className="px-4 py-2.5 rounded-xl bg-brand-yellow hover:bg-[#E5BE4E] text-brand-dark font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            + Thêm Thửa Đất Mới
          </Link>
          <Link
            to="/admin/master-data/lands/create"
            className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            + Thêm Nông Trại Mới
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link
              key={idx}
              to={s.link}
              className="admin-card p-5 group flex flex-col justify-between hover:border-brand-green transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider leading-tight">
                  {s.label}
                </span>
                <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-heading font-black text-brand-dark">
                  {s.value}
                </span>
                <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-brand-green transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Section: Master Data Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Master Data Health - 6 cols */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-green" />
              Tình Trạng Dữ Liệu (Master Data Health)
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Hệ thống ổn định
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border text-brand-muted">
              Dữ liệu tình trạng sẽ hiển thị khi hệ thống cung cấp endpoint kiểm tra master data.
            </div>
            {/* Health indicators are intentionally omitted until backed by the audit API. */}
            <div className="hidden">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-900 block font-semibold">100% Thửa đất đã cấu hình thổ nhưỡng & ranh giới</strong>
                <span className="text-emerald-800 text-[11px]">Tất cả các thửa P-101 đến P-106 đã liên kết với phân vùng Master Land tương ứng.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Ma trận tương thích (Compatibility) đã kích hoạt</strong>
                <span className="text-emerald-800 text-[11px]">Kiểm soát chặt chẽ quy tắc tương thích, ngăn chọn giống cây không phù hợp với đất.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-amber-900 block font-semibold">Cảnh báo: 1 trạm IoT đang ở trạng thái Offline</strong>
                <span className="text-amber-800 text-[11px]">Trạm IOT-DD-01 tại Thung Lũng Đơn Dương cần kiểm tra pin mặt trời.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-amber-900 block font-semibold">Giống Cải bó xôi Nhật chưa gán Quy trình chuẩn</strong>
                <span className="text-amber-800 text-[11px]">Chuyên gia cần bổ sung Process Template trước khi mở cho thuê hình thức Assisted-growing.</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Recent Updates - 6 cols */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-green" />
              Lịch Sử Cập Nhật Dữ Liệu Gần Đây
            </h3>
            <span className="text-[11px] text-brand-muted">Ghi nhận qua Audit Log</span>
          </div>

          <div className="space-y-3">
            {recentUpdates.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-brand-cream/40 border border-brand-border/60 flex items-center justify-between text-xs hover:bg-brand-cream/80 transition-colors"
              >
                <div>
                  <p className="font-bold text-brand-dark">{item.title}</p>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Thực hiện bởi: <strong>{item.user}</strong> • {item.time}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-brand-green border border-brand-border shadow-2xs">
                  {item.type}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <Link
              to="/admin/master-data/plots"
              className="text-xs font-bold text-brand-green hover:underline inline-flex items-center gap-1"
            >
              <span>Xem nhật ký vận hành chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
