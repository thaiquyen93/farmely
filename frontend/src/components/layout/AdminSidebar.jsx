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
  Building2
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
    name: 'Thửa Đất Canh Tác (Plots)',
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
    path: '/admin/master-data/process-templates',
    name: 'Quy Trình Chuẩn VietGAP',
    icon: FileSpreadsheet
  }
];

export default function AdminSidebar({ mobileOpen = false, setMobileOpen }) {
  return (
    <aside
      className={`admin-sidebar fixed inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
            <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-black text-white tracking-wider">
              FARMELY
            </h1>
            <p className="text-[10px] text-brand-yellow uppercase tracking-widest font-bold">
              Master Data Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold text-white/50 uppercase tracking-wider">
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
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Back to Public Site */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/80 hover:text-brand-yellow hover:bg-white/5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ công cộng</span>
        </Link>
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-white/70">
          <ShieldCheck className="w-4 h-4 text-brand-yellow shrink-0" />
          <span>Phiên bản Master Data v2.1 (BR01-BR25)</span>
        </div>
      </div>
    </aside>
  );
}
