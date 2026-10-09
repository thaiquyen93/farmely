import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Sprout, X, UsersRound, Check } from 'lucide-react';
import { DEMO_ACCOUNTS, useAuthStore } from '../../stores/authStore';

const roleHome = {
  CUSTOMER: '/customer/dashboard',
  STAFF: '/staff/dashboard',
  EXPERT: '/expert/dashboard',
  ADMIN: '/admin/master-data',
};

export default function PublicNavbar() {
  const { user, logout, switchRole } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const home = user ? roleHome[user.role] || '/' : '/';
  const isPublicHome = location.pathname === '/' && !user;
  const solidNavbar = !isPublicHome || scrolled || mobileOpen;
  const onRoleDashboard = ['/customer/dashboard', '/staff/dashboard', '/expert/dashboard'].includes(location.pathname);
  const links = onRoleDashboard ? [] : user?.role === 'CUSTOMER'
    ? [{ to: '/customer/dashboard', label: 'Vườn của tôi', end: true }, { to: '/customer/dashboard?tab=marketplace', label: 'Marketplace' }]
    : user ? [{ to: home, label: 'Tổng quan', end: true }] : [{ to: '/', label: 'Trang chủ', end: true }, { to: '/marketplace', label: 'Marketplace' }];
  const isActive = to => to.includes('?') ? window.location.pathname + window.location.search === to : window.location.pathname === to && !window.location.search.includes('tab=marketplace');
  const signOut = () => { logout(); setAccountOpen(false); setMobileOpen(false); navigate('/'); };
  const switchDemoUser = role => {
    switchRole(role);
    setAccountOpen(false);
    setMobileOpen(false);
    navigate(roleHome[role] || '/');
  };

  useEffect(() => {
    const updateNavbar = () => setScrolled(window.scrollY > 28);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
    return () => window.removeEventListener('scroll', updateNavbar);
  }, [location.pathname]);

  return <nav className={`fixed inset-x-0 top-0 z-50 text-white transition-[background-color,box-shadow,backdrop-filter] duration-300 ${solidNavbar ? 'bg-brand-dark/95 shadow-lg backdrop-blur-md' : 'bg-transparent shadow-none'}`} aria-label="Điều hướng chính">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <Link to={home} className="flex shrink-0 items-center gap-2.5" onClick={() => setMobileOpen(false)}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-brand-dark"><Sprout size={19} /></span><span className="font-heading text-xl font-black tracking-wide text-white">FARMELY</span></Link>
      <div className="hidden items-center gap-2 md:flex">{links.map(link => <NavLink key={link.to} to={link.to} end={link.end} className={() => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive(link.to) ? 'bg-white/15 text-brand-yellow' : 'text-white/90 hover:bg-white/10 hover:text-brand-yellow'}`}>{link.label}</NavLink>)}</div>
      <div className="hidden items-center gap-2 md:flex">{user ? <div className="relative"><button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10"><span className="max-w-36 truncate">{user.fullName}</span><ChevronDown size={15} /></button>{accountOpen && <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-brand-border bg-white p-2 text-brand-dark shadow-xl"><Link to={home} onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-cream">Tổng quan</Link><div className="my-2 border-t border-brand-border pt-2"><p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-brand-muted"><UsersRound size={13} className="mr-1 inline" /> Chuyển người dùng nhanh</p>{DEMO_ACCOUNTS.map(account => <button key={account.role} type="button" onClick={() => switchDemoUser(account.role)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-cream"><span><strong className="block">{account.fullName}</strong><small className="text-brand-muted">{account.roleTitle}</small></span>{user.role === account.role && <Check size={15} className="text-brand-green" />}</button>)}</div><button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"><LogOut size={15} /> Đăng xuất</button></div>}</div> : <><Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/10">Đăng nhập</Link><Link to="/register" className="rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-dark hover:bg-yellow-300">Đăng ký</Link></>}</div>
      <button type="button" className="rounded-lg p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X /> : <Menu />}</button>
    </div>
    {mobileOpen && <div className="space-y-1 border-t border-white/15 px-4 pb-4 pt-2 md:hidden">{links.map(link => <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`block rounded-lg px-3 py-2 text-sm font-semibold ${isActive(link.to) ? 'bg-white/15 text-brand-yellow' : 'text-white'}`}>{link.label}</Link>)}{user ? <button type="button" onClick={signOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm">Đăng xuất</button> : <div className="flex gap-2 px-3 pt-2"><Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg border border-white/30 px-3 py-2 text-sm">Đăng nhập</Link><Link to="/register" onClick={() => setMobileOpen(false)} className="rounded-lg bg-brand-yellow px-3 py-2 text-sm font-bold text-brand-dark">Đăng ký</Link></div>}</div>}
  </nav>;
}
