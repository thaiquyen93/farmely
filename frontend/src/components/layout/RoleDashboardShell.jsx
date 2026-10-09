import React from 'react';
import { BookOpenText, ClipboardList, Leaf, MapPinned, MessageSquareText, TriangleAlert, Wheat } from 'lucide-react';
import PublicNavbar from './PublicNavbar';

const tabIcons = {
  tasks: ClipboardList,
  plots: MapPinned,
  issues: TriangleAlert,
  harvest: Wheat,
  advice: MessageSquareText,
  templates: BookOpenText,
};

export default function RoleDashboardShell({ eyebrow, title, description, tabs, activeTab, onTabChange, children }) {
  return <div className="min-h-screen bg-brand-cream">
    <PublicNavbar />
    <aside className="fixed inset-y-0 left-0 top-20 z-30 hidden w-60 border-r border-brand-border bg-white lg:flex lg:flex-col">
      <div className="border-b border-brand-border p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-brand-green"><Leaf size={20} /></span>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-brand-green">{eyebrow}</p>
        <h2 className="mt-1 font-heading text-xl font-black text-brand-dark">{title}</h2>
      </div>
      <nav className="flex-1 space-y-1.5 p-3" aria-label={`Điều hướng ${title}`}>
        {tabs.map(tab => { const Icon = tab.icon || tabIcons[tab.id] || ClipboardList; return <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeTab === tab.id ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-muted hover:bg-brand-cream hover:text-brand-dark'}`} aria-current={activeTab === tab.id ? 'page' : undefined}><Icon size={18} className={activeTab === tab.id ? 'text-brand-yellow' : 'text-brand-green'} /><span>{tab.label}</span></button>; })}
      </nav>
      <div className="border-t border-brand-border p-4 text-xs leading-relaxed text-brand-muted">Chỉ hiển thị dữ liệu và hành động cần thiết cho vai trò hiện tại.</div>
    </aside>
    <main className="px-4 pb-20 pt-28 sm:px-6 lg:ml-60 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green lg:hidden">{eyebrow}</p><h1 className="mt-1 font-heading text-3xl font-black text-brand-dark">{title}</h1><p className="mt-1 text-sm text-brand-muted">{description}</p></div><span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs text-brand-muted">Dữ liệu minh họa</span></div>
        <div className="mb-7 flex gap-2 overflow-x-auto border-b border-brand-border pb-3 lg:hidden" role="tablist">{tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onTabChange(tab.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${activeTab === tab.id ? 'bg-brand-dark text-white' : 'bg-white text-brand-dark hover:bg-brand-green/10'}`}>{tab.label}</button>)}</div>
        {children}
      </div>
    </main>
  </div>;
}
