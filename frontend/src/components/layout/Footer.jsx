import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Footer() {
  const role = useAuthStore(state => state.user?.role);
  const marketplace = role === 'CUSTOMER' ? '/customer/dashboard?tab=marketplace' : '/marketplace';
  return <footer className="bg-brand-dark py-8 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2"><Sprout className="text-brand-yellow" size={20} /><span className="font-heading text-lg font-black">FARMELY</span><span className="ml-2 text-xs text-white/65">Thuê và canh tác tại Farmely</span></div><div className="flex flex-wrap gap-5 text-sm text-white/80"><Link to={role ? (role === 'CUSTOMER' ? '/customer/dashboard' : `/${role.toLowerCase()}/dashboard`) : '/'} className="hover:text-brand-yellow">Trang chủ</Link>{(!role || role === 'CUSTOMER') && <Link to={marketplace} className="hover:text-brand-yellow">Marketplace</Link>}<Link to="/site-visit/book" className="hover:text-brand-yellow">Đặt lịch tham quan</Link></div></div></footer>;
}
