import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Grid3X3,
  Sprout,
  Wheat,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Database
} from 'lucide-react';
import { farmApi } from '../../api/farm/farmApi';
import { cropsData } from '../../data/crops';
import { varietiesData } from '../../data/varieties';
import { iotStationsData } from '../../data/iotStations';
import { processTemplatesData } from '../../data/processTemplates';
import { knowledgeDocumentsData } from '../../data/knowledgeDocuments';

// ponytail: format tại chỗ bằng Intl stdlib; nâng lên date-fns khi cần timezone/locale phức tạp
const formatAuditTime = (raw) => {
  if (!raw) return '—';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function MasterDataDashboard() {
  const [summary, setSummary] = useState(null);
  const [dbLandsCount, setDbLandsCount] = useState(0);
  const [dbPlotsCount, setDbPlotsCount] = useState(0);
  const [dbAvailPlotsCount, setDbAvailPlotsCount] = useState(0);
  const [isLiveDb, setIsLiveDb] = useState(false);

  useEffect(() => {
    let active = true;

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

  // Nhóm theo đúng trục nghiệp vụ: Quỹ đất · Sinh học · Quy trình & Khí tượng
  const statGroups = [
    {
      group: 'Quỹ Đất Canh Tác',
      caption: 'Khu nông trại, thửa đất và tình trạng cho thuê',
      items: [
        { label: 'Khu Nông Trại (Lands)', value: totalLands, unit: 'khu', icon: Building2, link: '/admin/master-data/lands' },
        { label: 'Thửa Đất (Plots)', value: totalPlots, unit: 'thửa', icon: Grid3X3, link: '/admin/master-data/plots' },
        { label: 'Thửa Đất Khả Dụng (Available)', value: availablePlots, unit: `/ ${totalPlots} thửa`, icon: CheckCircle2, link: '/admin/master-data/plots', accent: true }
      ]
    },
    {
      group: 'Dữ Liệu Sinh Học',
      caption: 'Danh mục cây trồng và giống cây chuẩn hóa',
      items: [
        { label: 'Danh Mục Cây (Crops)', value: totalCrops, unit: 'danh mục', icon: Sprout, link: '/admin/master-data/crops' },
        { label: 'Giống Cây (Varieties)', value: totalVarieties, unit: 'giống', icon: Wheat, link: '/admin/master-data/varieties' }
      ]
    },
    {
      group: 'Quy Trình & Kỹ Thuật Canh Tác',
      caption: 'Quy trình chuẩn VietGAP và tài liệu kỹ thuật',
      items: [
        { label: 'Quy Trình Chuẩn VietGAP', value: activeTemplates, unit: 'quy trình', icon: FileSpreadsheet, link: '/admin/master-data/process-templates' },
        { label: 'Tài Liệu Kỹ Thuật (RAG)', value: totalDocs, unit: 'tài liệu', icon: BookOpen, link: '/admin/master-data/knowledge-documents' }
      ]
    }
  ];

  // ponytail: map tĩnh vì Tailwind không quét được class nội suy; mở rộng khi nhóm có 4+ thẻ
  const GRID_BY_COUNT = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

  const AUDIT_TONES = {
    'Thanh lý': 'border-rose-200 bg-rose-50 text-rose-700',
    'Hợp đồng': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'Hiện trường': 'border-amber-200 bg-amber-50 text-amber-800',
    'Bảo mật': 'border-sky-200 bg-sky-50 text-sky-700'
  };

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
          title = `Hoàn thành: ${log.details?.step_name || ''} tại ${log.details?.plot || ''}`;
          type = 'Hiện trường';
        } else if (log.action === 'CANCEL_REQUEST') {
          title = `Yêu cầu thanh lý: ${log.details?.reason || ''}`;
          type = 'Thanh lý';
        } else if (log.action === 'APPROVE_CANCELLATION') {
          title = `Duyệt thanh lý hợp đồng #${log.entity_id}`;
          type = 'Thanh lý';
        } else {
          title = `${log.action} trên ${log.entity_name} #${log.entity_id}`;
          type = log.action;
        }
        return {
          title,
          time: formatAuditTime(log.created_at),
          user: log.user_name || 'Hệ thống',
          type
        };
      })
    : [
        { title: 'Cập nhật ngưỡng cảnh báo khí tượng khu Củ Chi', time: '15 phút trước', user: 'CGNN. Nguyễn Hoàng Nam', type: 'Weather Config' },
        { title: 'Phê duyệt quy trình VietGAP Cà chua bi v2.3', time: '2 giờ trước', user: 'Hội đồng Nông học', type: 'Template' },
        { title: 'Thêm giống mới: Dâu tây Nhật Hana chịu nhiệt', time: 'Hôm qua, 16:30', user: 'CGNN. Đặng Thu Thảo', type: 'Variety' },
        { title: 'Hoàn tất bảo trì nghỉ đất 4 ngày thửa P-16', time: '2 ngày trước', user: 'Admin Hệ Thống', type: 'Fallow Protocol' }
      ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-border bg-brand-cream px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-green">
              Hệ Thống Quản Trị Trung Tâm
            </span>
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${
              isLiveDb
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-stone-200 bg-stone-100 text-stone-600'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isLiveDb ? 'animate-pulse bg-emerald-500' : 'bg-stone-400'}`} />
              <span>{isLiveDb ? 'Live DB: PostgreSQL' : 'Đang kết nối CSDL'}</span>
            </span>
          </div>
          <h1 className="mt-1.5 font-heading text-xl font-black text-brand-dark sm:text-2xl">
            Farmely Master Data
          </h1>
          <p className="mt-0.5 text-xs text-brand-muted">
            Quản lý và chuẩn hóa nền tảng dữ liệu quỹ đất, giống cây, quy trình chuẩn VietGAP và trạm khí tượng thực địa.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Link
            to="/admin/master-data/plots/create"
            className="whitespace-nowrap rounded-xl border border-brand-border bg-white px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-wider text-brand-dark shadow-2xs transition-all hover:border-brand-green hover:bg-brand-cream"
          >
            + Thêm Thửa Đất
          </Link>
          <Link
            to="/admin/master-data/lands/create"
            className="whitespace-nowrap rounded-xl bg-brand-green px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-brand-dark"
          >
            + Thêm Khu Nông Trại
          </Link>
        </div>
      </div>

      {/* KPI theo nhóm nghiệp vụ */}
      <div className="space-y-4">
        {statGroups.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <div className="mb-2 flex items-baseline gap-3">
              <div className="min-w-0">
                <h2 className="font-heading text-sm font-black uppercase tracking-widest text-brand-dark">
                  {g.group}
                </h2>
              </div>
              <span className="mb-1 h-px flex-1 bg-brand-border/70" />
              <span className="mb-1 shrink-0 whitespace-nowrap text-[11px] font-bold text-brand-muted">
                {g.items.length} danh mục
              </span>
            </div>

            <div className={`grid grid-cols-1 gap-3 ${GRID_BY_COUNT[g.items.length] || 'sm:grid-cols-3'}`}>
              {g.items.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    to={s.link}
                    className={`group relative flex min-h-[112px] flex-row items-center gap-3 overflow-hidden rounded-2xl border bg-white p-4 pl-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                      s.accent ? 'border-brand-yellow/70' : 'border-brand-border hover:border-brand-green'
                    }`}
                  >
                    {/* Dải màu định danh nhóm chạy dọc mép trái */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1 ${s.accent ? 'bg-brand-yellow' : 'bg-brand-green/25 group-hover:bg-brand-green'} transition-colors`}
                    />

                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                        s.accent ? 'bg-brand-yellow/25 text-amber-700' : 'bg-brand-cream text-brand-green'
                      }`}>
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-brand-muted">
                        {s.label}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-heading text-2xl font-black leading-none text-brand-dark">
                          {s.value}
                        </span>
                        <span className="text-[11px] font-semibold text-brand-muted">{s.unit}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-green" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Audit Log toàn chiều ngang */}
      <section className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-brand-dark">
            <Clock className="h-5 w-5 text-brand-green" />
            Lịch Sử Cập Nhật Dữ Liệu Gần Đây
          </h3>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-brand-muted">
            <Database className="h-3.5 w-3.5" />
            Ghi nhận qua Audit Log
          </span>
        </div>

        <ul className="mt-2 divide-y divide-brand-border/60">
          {recentUpdates.slice(0, 5).map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-brand-cream/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-brand-dark">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-brand-muted">
                  Thực hiện bởi: <strong className="font-semibold text-stone-700">{item.user}</strong> • {item.time}
                </p>
              </div>
              <span className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                AUDIT_TONES[item.type] || 'border-brand-border bg-brand-cream/60 text-brand-green'
              }`}>
                {item.type}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-2 text-right">
          <Link
            to="/admin/master-data/audit-logs"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:underline"
          >
            <span>Xem nhật ký vận hành chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
