import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Settings, Sprout, UserRound } from 'lucide-react';
import PublicNavbar from '../layout/PublicNavbar';

const links = [
  ['/customer/dashboard', 'Vườn của tôi', LayoutDashboard],
  ['/customer/profile', 'Hồ sơ cá nhân', UserRound],
  ['/customer/settings', 'Cài đặt', Settings],
  ['/customer/dashboard?view=contracts', 'Hợp đồng', FileText]
];

export default function CustomerAccountLayout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3eb] text-[#173b2e]">
      <aside className="fixed inset-y-0 left-0 z-[60] hidden w-16 flex-col items-center bg-[#063d2b] py-5 text-white shadow-xl lg:flex">
        <Link to="/" aria-label="Farmely" className="mb-8 text-lime-400"><Sprout className="h-8 w-8" /></Link>
        <nav className="flex flex-1 flex-col gap-3">
          {links.map(([to, label, Icon]) => {
            const pathname = to.split('?')[0];
            const active = location.pathname === pathname && (pathname !== '/customer/dashboard' || to.includes('contracts') === location.search.includes('contracts'));
            return <Link key={to} to={to} aria-label={label} title={label} className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${active ? 'bg-white text-emerald-800 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5" /></Link>;
          })}
        </nav>
      </aside>
      <PublicNavbar dashboardRailCollapsed hideBrand />
      <main className="box-border min-w-0 px-4 pb-20 pt-24 sm:px-7 lg:ml-16 lg:w-[calc(100%-4rem)] lg:px-10 lg:pt-28">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
