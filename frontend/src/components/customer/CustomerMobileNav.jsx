import React from 'react';
import { CalendarCheck, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { label: 'Tổng quan', icon: LayoutDashboard, view: 'overview' },
  { label: 'Công việc & Nhật ký', icon: CalendarCheck, view: 'tasks' },
  { label: 'Dịch vụ', icon: ShoppingBag, view: 'services' }
];

export default function CustomerMobileNav({ activeView, onSelectTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const plotParam = searchParams.get('plot') || searchParams.get('plotCode');
  const rawView = searchParams.get('tab') || searchParams.get('view') || 'overview';
  const normalizedView = rawView === 'yards' ? 'overview' : rawView === 'diary' ? 'tasks' : rawView;
  const current = activeView === 'yards' ? 'overview' : activeView === 'diary' ? 'tasks' : (activeView || normalizedView);

  const handleSelect = (view) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(view);
      return;
    }
    if (plotParam) {
      navigate(`/customer/dashboard?plot=${encodeURIComponent(plotParam)}${view === 'overview' ? '' : `&tab=${view}`}`);
      return;
    }
    if (view === 'overview') {
      navigate('/customer/dashboard');
    } else if (view === 'tasks') {
      navigate('/customer/dashboard?view=diary');
    } else {
      navigate(`/customer/dashboard?view=${view}`);
    }
  };

  return (
    <nav aria-label="Điều hướng khách hàng trên di động" className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d8dfd9] bg-white/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(6,61,43,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-1.5">
        {items.map(({ label, icon: Icon, view }) => {
          const selected = current === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => handleSelect(view)}
              aria-current={selected ? 'page' : undefined}
              className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                selected
                  ? 'bg-[#18352b] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 active:bg-stone-100'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-lime-300 stroke-[2.5]' : ''}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
