import React from 'react';
import { CalendarDays, FileText, Leaf, ShoppingBag, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { label: 'Vườn của tôi', icon: Leaf, to: '/customer/dashboard', view: 'yards' },
  { label: 'Lịch canh tác', icon: CalendarDays, to: '/customer/dashboard?view=tasks', view: 'tasks' },
  { label: 'Dịch vụ', icon: ShoppingBag, to: '/customer/dashboard?view=services', view: 'services' },
  { label: 'Hợp đồng', icon: FileText, to: '/customer/dashboard?view=contracts', view: 'contracts' },
  { label: 'Tài khoản', icon: UserRound, to: '/customer/profile', view: 'account' }
];

export default function CustomerMobileNav({ activeView }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inferredView = location.pathname.includes('/customer/profile') || location.pathname.includes('/customer/settings')
    ? 'account'
    : new URLSearchParams(location.search).get('view') || 'yards';
  const current = activeView || inferredView;

  return (
    <nav aria-label="Điều hướng khách hàng trên di động" className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d8dfd9] bg-white/95 px-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(6,61,43,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ label, icon: Icon, to, view }) => {
          const selected = current === view;
          return <button key={view} type="button" onClick={() => navigate(to)} aria-current={selected ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition ${selected ? 'bg-emerald-50 text-emerald-800' : 'text-stone-500 active:bg-stone-100'}`}>
            <Icon className={`h-5 w-5 ${selected ? 'stroke-[2.5]' : ''}`} />
            <span className="max-w-full truncate">{label}</span>
          </button>;
        })}
      </div>
    </nav>
  );
}
