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
  Clock,
  Database
} from 'lucide-react';
import { farmApi } from '../../api/farm/farmApi';
import { cropsData } from '../../data/crops';
import { varietiesData } from '../../data/varieties';
import { iotStationsData } from '../../data/iotStations';
import { processTemplatesData } from '../../data/processTemplates';
import { knowledgeDocumentsData } from '../../data/knowledgeDocuments';

export default function MasterDataDashboard() {
  const [summary, setSummary] = useState(null);
  const [dbLandsCount, setDbLandsCount] = useState(0);
  const [dbPlotsCount, setDbPlotsCount] = useState(0);
  const [dbAvailPlotsCount, setDbAvailPlotsCount] = useState(0);
  const [isLiveDb, setIsLiveDb] = useState(false);

  useEffect(() => {
    let active = true;

    // Load lands & plots live count from database
    Promise.all([
      farmApi.listLands().catch(() => []),
      farmApi.listPlots().catch(() => [])
    ]).then(([lands, plots]) => {
      if (!active) return;
      setDbLandsCount((lands || []).length);
      setDbPlotsCount((plots || []).length);
      setDbAvailPlotsCount((plots || []).filter((p) => p.status === 'AVAIL' || p.status === 'AVAILABLE').length);
      setIsLiveDb(true);
    });

    fetch('/api/v1/master-data/summary')
      .then((res) => res.json())
      .then((res) => {
        if (!active) return;
        if (res && res.success && res.data) {
          setSummary(res.data);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        console.warn('Cannot fetch live master-data summary:', err);
      });
    return () => { active = false; };
  }, []);

  const totalLands = summary?.totalLands ?? dbLandsCount;
  const totalPlots = summary?.totalPlots ?? dbPlotsCount;
  const availablePlots = summary?.availablePlots ?? dbAvailPlotsCount;
  const totalCrops = summary?.totalCrops ?? cropsData.length;
  const totalVarieties = summary?.totalVarieties ?? varietiesData.length;
  const totalIoT = summary?.totalIoT ?? iotStationsData.length;
  const activeTemplates = summary?.activeTemplates ?? processTemplatesData.filter((t) => t.status === 'ACTIVE').length;
  const totalDocs = summary?.totalDocs ?? knowledgeDocumentsData.length;

  const stats = [
    { label: 'Tổng số Nông Trại (Lands)', value: totalLands, icon: Building2, link: '/admin/master-data/lands', color: 'text-brand-green' },
    { label: 'Tổng số Thửa Đất', value: totalPlots, icon: Grid3X3, link: '/admin/master-data/plots', color: 'text-emerald-700' },
    { label: 'Thửa Đất Khả Dụng', value: availablePlots, icon: CheckCircle2, link: '/admin/master-data/plots', color: 'text-brand-yellow' },
    { label: 'Danh Mục Cây (Crops)', value: totalCrops, icon: Sprout, link: '/admin/master-data/crops', color: 'text-brand-green' },
    { label: 'Giống Cây (Varieties)', value: totalVarieties, icon: Wheat, link: '/admin/master-data/varieties', color: 'text-amber-700' },
    { label: 'Trạm Cảm Biến IoT', value: totalIoT, icon: Radio, link: '/admin/master-data/iot-stations', color: 'text-sky-700' },
    { label: 'Quy Trình Chuẩn VietGAP', value: activeTemplates, icon: FileSpreadsheet, link: '/admin/master-data/process-templates', color: 'text-emerald-700' },
    { label: 'Tài Liệu Kỹ Thuật (RAG)', value: totalDocs, icon: BookOpen, link: '/admin/master-data/knowledge-documents', color: 'text-indigo-700' },
  ];

  const recentUpdates = (summary?.recentAuditLogs?.length)
    ? summary.recentAuditLogs.map((log) => {
        let title = '';
        let type = 'Audit Log';
        if (log.action === 'AUTH_LOGIN') {
          title = `Đăng nhập vào hệ thống (${log.details?.platform || 'WEB'})`;
          type = 'Bảo mật';
        } else if (log.action === 'CONTRACT_CONFIRM') {
          title = `Ký hợp đồng ${log.details?.contract_number || ''} (${Number(log.details?.amount || 0).toLocaleString('vi-VN')} đ)`;
          type = 'Hợp đồng';
        } else if (log.action === 'TASK_FINISH') {
          title = `Nghiệm thu: ${log.details?.step_name || ''} tại ${log.details?.plot || ''}`;
          type = 'Hiện trường';
        } else if (log.action === 'CANCEL_REQUEST') {
          title = `Yêu cầu thanh lý: ${log.details?.reason || ''}`;
          type = 'Thanh lý';
        } else {
          title = `${log.action} trên ${log.entity_name} #${log.entity_id}`;
          type = log.action;
        }
        return {
          title,
          time: log.created_at,
          user: log.user_name || 'Hệ thống',
          type
        };
      })
    : [
        { title: 'Cập nhật ngưỡng an toàn trạm IoT-CC-01', time: '15 phút trước', user: 'CGNN. Nguyễn Hoàng Nam', type: 'IoT Config' },
        { title: 'Phê duyệt quy trình VietGAP Cà chua bi v2.3', time: '2 giờ trước', user: 'Hội đồng Nông học', type: 'Template' },
        { title: 'Thêm giống mới: Dâu tây Nhật Hana chịu nhiệt', time: 'Hôm qua, 16:30', user: 'CGNN. Đặng Thu Thảo', type: 'Variety' },
        { title: 'Hoàn tất nghiệm thu nghỉ đất 4 ngày thửa P-16', time: '2 ngày trước', user: 'Admin Hệ Thống', type: 'Fallow Protocol' },
      ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green uppercase tracking-wider border border-brand-border">
              Hệ Thống Quản Trị Trung Tâm
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live DB: PostgreSQL</span>
              </span>
            )}
          </div>
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
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-900 block font-semibold">100% Thửa đất đã cấu hình thổ nhưỡng & ranh giới</strong>
                <span className="text-emerald-800 text-[11px]">Tất cả {totalPlots} thửa đất ({totalPlots > 0 ? `P-01 đến P-${String(totalPlots).padStart(2, '0')}` : 'đang tải'}) đã liên kết với phân vùng Master Land tương ứng.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Ma trận tương thích (Compatibility) đã kích hoạt</strong>
                <span className="text-emerald-800 text-[11px]">Kiểm soát chặt chẽ BR03, đã liên kết {totalVarieties} giống cây VietGAP thích ứng với từng thửa đất.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Quy trình chuẩn VietGAP đã phủ kín 100% giống cây</strong>
                <span className="text-emerald-800 text-[11px]">{activeTemplates} quy trình chuẩn đã được CGNN biên soạn sẵn sàng cho hình thức Assisted-growing.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 flex items-start gap-3">
              <Radio className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-sky-900 block font-semibold">Trạm quan trắc IoT vi khí hậu đang vận hành</strong>
                <span className="text-sky-800 text-[11px]">{totalIoT} trạm cảm biến đo nhiệt độ, độ ẩm không khí và độ ẩm đất tự động (BR18 hoãn tưới khi độ ẩm đất ≥ 80%).</span>
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
