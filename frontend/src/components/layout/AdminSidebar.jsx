import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Grid3X3,
  Radio,
  Sprout,
  Wheat,
  SlidersHorizontal,
  BookOpen,
  FileSpreadsheet,
  ArrowLeft,
  ShieldCheck,
  Building2,
  BriefcaseBusiness,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const masterDataNavItems = [
  {
    path: '/admin/master-data',
    name: 'Tổng quan Master Data',
    icon: LayoutDashboard,
    end: true
  },
  {
    path: '/admin/master-data/lands',
    name: 'Quản lý Nông Trại (Lands)',
    icon: Building2
  },
  {
    path: '/admin/master-data/plots',
    name: 'Thửa Đất Canh Tác',
    icon: Grid3X3
  },
  {
    path: '/admin/master-data/iot-stations',
    name: 'Trạm Cảm Biến IoT',
    icon: Radio
  },
  {
    path: '/admin/master-data/crops',
    name: 'Danh Mục Cây Trồng (Crops)',
    icon: Sprout
  },
  {
    path: '/admin/master-data/varieties',
    name: 'Giống Cây Trồng (Varieties)',
    icon: Wheat
  },
  {
    path: '/admin/master-data/compatibility',
    name: 'Tương Thích Thổ Nhưỡng',
    icon: SlidersHorizontal
  },
  {
    path: '/admin/master-data/knowledge-documents',
    name: 'Tài Liệu Kỹ Thuật (RAG Docs)',
    icon: BookOpen
  },
  {
    path: '/admin/master-data/services',
    name: 'Dịch Vụ & Mẫu CareTask',
    icon: BriefcaseBusiness
  },
  {
    path: '/admin/master-data/process-templates',
    name: 'Quy Trình Chuẩn VietGAP',
    icon: FileSpreadsheet
  }
];

export default function AdminSidebar({ mobileOpen = false, setMobileOpen, collapsed = false, setCollapsed }) {
  return (
    <aside
      className={`admin-sidebar fixed inset-y-0 left-0 z-40 ${collapsed ? 'lg:w-20' : 'lg:w-72'} w-72 flex flex-col transition-[width,transform] duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-6 ${collapsed ? 'lg:p-3' : ''} min-h-24 border-b border-white/10 flex items-center justify-between gap-2`}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
            <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
          </div>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <h1 className="font-heading text-xl font-black text-white tracking-wider">
              FARMELY
            </h1>
            <p className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold">
              Master Data Admin
            </p>
          </div>
        </Link>
        <button type="button" onClick={() => setCollapsed?.((value) => !value)} className="hidden lg:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'Mở rộng menu Master Data' : 'Thu gọn menu Master Data'} title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className={`${collapsed ? 'lg:px-2' : 'px-4'} flex-1 overflow-y-auto py-6 space-y-1.5`}>
        <div className={`px-3 pb-2 text-[11px] font-bold text-white/50 uppercase tracking-wider ${collapsed ? 'lg:hidden' : ''}`}>
          Hệ Thống Dữ Liệu Nền Tảng
        </div>

        {masterDataNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `admin-nav-item relative group ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className={`${collapsed ? 'lg:hidden' : ''} truncate`}>{item.name}</span>
              {collapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-stone-950 px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Back to Public Site */}
      <div className={`p-4 ${collapsed ? 'lg:px-2' : ''} py-4 border-t border-white/10 space-y-2`}>
        <Link
          to="/"
          title={collapsed ? 'Về trang chủ công cộng' : undefined}
          className={`relative group flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/80 hover:text-brand-yellow hover:bg-white/5 rounded-xl transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className={collapsed ? 'lg:hidden' : ''}>Về trang chủ công cộng</span>
          {collapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-stone-950 px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">Về trang chủ</span>}
        </Link>
        <div className={`px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-white/70 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`} title={collapsed ? 'Master Data v2.1' : undefined}>
          <ShieldCheck className="w-4 h-4 text-brand-yellow shrink-0" />
          <span className={collapsed ? 'lg:hidden' : ''}>Phiên bản Master Data v2.1 (BR01-BR25)</span>
        </div>
      </div>
    </aside>
  );
}
