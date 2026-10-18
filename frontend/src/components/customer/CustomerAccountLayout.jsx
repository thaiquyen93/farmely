import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Apple, BookOpen, Calendar, ClipboardList, FileText, LayoutDashboard, PanelLeftClose, PanelLeftOpen, ShoppingBag, Sprout } from 'lucide-react';
import PublicNavbar from '../layout/PublicNavbar';
import CustomerMobileNav from './CustomerMobileNav';

const links = [
  ['Tổng quan', LayoutDashboard, '/customer/dashboard'],
  ['Lịch canh tác', Calendar, '/customer/dashboard?view=tasks'],
  ['Dịch vụ canh tác', ShoppingBag, '/customer/dashboard?view=services'],
  ['Nhật ký nông trại', BookOpen, '/customer/dashboard?view=diary'],
  ['Quy trình canh tác chuẩn', ClipboardList, '/customer/dashboard?view=process'],
  ['Kết quả thu hoạch & nghiệm thu', Apple, '/customer/dashboard?view=harvest'],
  ['Hợp đồng thuê đất', FileText, '/customer/dashboard?view=contracts']
];

export default function CustomerAccountLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3eb] text-[#173b2e]">
      <aside className={`fixed inset-y-0 left-0 z-[60] hidden flex-col bg-[#063d2b] text-white shadow-2xl transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
        <div className={`flex items-center border-b border-white/10 ${sidebarCollapsed ? 'flex-col justify-center gap-3 p-3' : 'gap-3 px-5 py-5'}`}>
          <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-wide"><Sprout className="h-8 w-8 text-lime-400" />{!sidebarCollapsed && 'FARMELY'}</Link>
          <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className={`${sidebarCollapsed ? '' : 'ml-auto'} flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white`} aria-label={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}>
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="flex-1 space-y-2 px-3 py-6">
          {!sidebarCollapsed && <p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-white/55">Quản lý nông trại</p>}
          {links.map(([label, Icon, to]) => <button key={to} type="button" onClick={() => navigate(to)} title={sidebarCollapsed ? label : undefined} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
            <Icon className="h-5 w-5 shrink-0 text-white/85" />{!sidebarCollapsed && <span className="truncate">{label}</span>}{sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-[#063d2b] px-3 py-2 text-xs font-bold text-white shadow-lg group-hover:block">{label}</span>}
          </button>)}
        </nav>
      </aside>
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} hideBrand />
      <main className={`box-border min-w-0 px-4 pb-28 pt-24 sm:px-7 lg:px-10 lg:pb-20 lg:pt-28 ${sidebarCollapsed ? 'lg:ml-16 lg:w-[calc(100%-4rem)]' : 'lg:ml-72 lg:w-[calc(100%-18rem)]'}`}>
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
      <CustomerMobileNav activeView="account" />
    </div>
  );
}
