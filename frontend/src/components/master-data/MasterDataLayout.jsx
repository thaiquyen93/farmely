import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../layout/AdminSidebar';
import { Menu, Bell, Shield, User, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function MasterDataLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.includes('/lands')) return 'Quản Lý Nông Trại (Land Properties)';
    if (pathname.includes('/plots')) return 'Quản Lý Thửa Đất Canh Tác (Plots)';
    if (pathname.includes('/iot-stations')) return 'Trạm Cảm Biến Môi Trường IoT';
    if (pathname.includes('/crops')) return 'Danh Mục Cây Trồng (Crops)';
    if (pathname.includes('/varieties')) return 'Danh Mục Giống Cây (Varieties)';
    if (pathname.includes('/compatibility')) return 'Ma Trận Tương Thích Thổ Nhưỡng – Giống Cây';
    if (pathname.includes('/knowledge-documents')) return 'Kho Tri Thức & Sổ Tay Kỹ Thuật (RAG)';
    if (pathname.includes('/process-templates')) return 'Quy Trình Canh Tác Chuẩn VietGAP';
    return 'Tổng Quan Quản Trị Master Data';
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark flex">
      {/* Sidebar for Desktop & Drawer for Mobile */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Backdrop for Mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Wrapper */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-brand-border px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-stone-600 hover:text-brand-dark rounded-lg hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider bg-brand-cream px-2 py-0.5 rounded-full border border-brand-border">
                  Farmely Master Data
                </span>
                <span className="text-stone-300">/</span>
                <span className="text-xs text-brand-muted hidden sm:inline">
                  Chuẩn hóa dữ liệu sinh học & quỹ đất
                </span>
              </div>
              <h1 className="font-heading text-lg sm:text-xl font-bold text-brand-dark truncate mt-0.5">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dữ liệu hoạt động bình thường</span>
            </div>

            {/* Admin User Badge */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-brand-border">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"}
                alt="Admin"
                className="w-9 h-9 rounded-full object-cover border border-brand-green/30"
              />
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-brand-dark leading-tight">{user?.fullName || "Ban Quản Trị"}</p>
                <p className="text-[11px] text-brand-muted">{user?.roleTitle || "Administrator"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
