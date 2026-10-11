import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function DashboardRail({ user, fallbackName, roleLabel, collapsed, setCollapsed, children, footer }) {
  return (
    <aside className={`w-full ${collapsed ? 'lg:w-20' : 'lg:w-72'} shrink-0 self-stretch overflow-visible rounded-2xl border border-brand-border bg-white shadow-sm transition-[width] duration-200 lg:sticky lg:top-24 lg:min-h-[calc(100vh-7rem)]`}>
      <div className={`flex items-center gap-3 border-b border-brand-border p-3 ${collapsed ? 'lg:flex-col' : ''}`}>
        <img src={user?.avatar} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-brand-border object-cover" />
        <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="truncate font-heading text-sm font-black text-brand-dark">{user?.fullName || fallbackName}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-brand-muted">{roleLabel}</p>
        </div>
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-brand-cream hover:text-brand-dark lg:inline-flex" aria-label={collapsed ? 'Mở rộng thanh quản lý' : 'Thu gọn thanh quản lý'} title={collapsed ? 'Mở rộng thanh quản lý' : 'Thu gọn thanh quản lý'}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">{children}</div>
      {footer && <div className={`border-t border-brand-border p-3 ${collapsed ? 'lg:hidden' : ''}`}>{footer}</div>}
    </aside>
  );
}
