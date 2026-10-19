import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function DashboardRail({ user, fallbackName, roleLabel, collapsed, setCollapsed, children, footer }) {
  return (
    <div className="w-full shrink-0 lg:w-0">
      <aside className={`flex w-full shrink-0 self-stretch flex-col overflow-visible rounded-2xl border border-emerald-900 bg-[#064b37] text-white shadow-sm transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:h-screen lg:rounded-none lg:border-y-0 lg:border-l-0 ${collapsed ? 'lg:w-16 lg:overflow-visible' : 'lg:w-72 lg:overflow-y-auto'}`}>
        <div className={`flex items-center gap-3 border-b border-white/15 ${collapsed ? 'lg:flex-col lg:px-2 lg:py-3' : 'p-4'}`}>
          <img src={user?.avatar} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-brand-border object-cover" />
          <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate font-heading text-base font-black text-white">{user?.fullName || fallbackName}</p>
            <p className="truncate text-xs font-bold uppercase tracking-wider text-emerald-100/70">{roleLabel}</p>
          </div>
          <button type="button" onClick={() => setCollapsed((value) => !value)} className={`${collapsed ? 'lg:mx-auto' : 'ml-auto'} hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow lg:inline-flex`} aria-label={collapsed ? 'Mở rộng thanh quản lý' : 'Thu gọn thanh quản lý'} title={collapsed ? 'Mở rộng thanh quản lý' : 'Thu gọn thanh quản lý'}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <div className={`flex min-h-0 flex-1 flex-col ${collapsed ? 'lg:p-2' : 'p-3'}`}>{children}</div>
        {footer && <div className={`border-t border-white/15 p-3 ${collapsed ? 'lg:hidden' : ''}`}>{footer}</div>}
      </aside>
    </div>
  );
}
