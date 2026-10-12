import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Home,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  BookCheck,
  Bell,
  ChevronDown,
  User,
  LogOut,
  FileText,
  Shield,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import Button from '../common/Button';

export default function CustomerNavbar({ activeTab, setActiveTab }) {
  const { user, logout, switchRole } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { id: 'yards', label: 'My Yards', icon: Sprout },
    { id: 'diary', label: 'Journal', icon: BookOpen },
    { id: 'services', label: 'Chores', icon: ClipboardList },
    { id: 'harvest', label: 'Produce', icon: ShoppingBag },
    { id: 'process', label: 'Cultivarium', icon: BookCheck }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F2E9]/95 backdrop-blur-md border-b border-[#294C3B]/10 transition-all">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[#F5CF62] flex items-center justify-center text-brand-dark shadow-sm group-hover:scale-105 transition-transform">
                <Sprout className="w-4 h-4 text-brand-dark stroke-[2.5]" />
              </div>
              <span className="font-heading text-xl font-black tracking-wider text-[#294C3B]">
                FARMELY
              </span>
            </Link>

            {/* Dashboard Home Icon */}
            <Link
              to="/customer/dashboard"
              className={`p-2 rounded-xl transition-colors ${
                location.pathname === '/customer/dashboard' && (!activeTab || activeTab === 'yards')
                  ? 'bg-[#426B4F]/15 text-[#294C3B]'
                  : 'text-stone-600 hover:text-brand-dark hover:bg-stone-100'
              }`}
              title="Dashboard Home"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>

          {/* CENTER: Customer Navigation (Matching reference image) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E3EBD7] text-[#294C3B] shadow-sm'
                      : 'text-stone-600 hover:text-[#294C3B] hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#426B4F]" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Marketplace link */}
            <Link
              to="/marketplace"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-stone-600 hover:text-[#294C3B] hover:bg-black/5 transition-all ml-1"
            >
              <span>Marketplace</span>
            </Link>
          </div>

          {/* RIGHT: Notifications + Role Switcher + User Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell (Screen Flow: Notification Center) */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 text-stone-600 hover:text-[#294C3B] rounded-full hover:bg-black/5 transition-colors relative"
                title="Thông báo (Notification Center)"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-brand-border p-3 z-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                    <span className="font-bold text-brand-dark">Trung Tâm Thông Báo</span>
                    <span className="text-[10px] text-brand-green font-semibold">2 mới</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100 space-y-0.5">
                    <p className="font-bold">✓ Cập nhật Farm Diary (Thửa A1)</p>
                    <p className="text-[11px] text-stone-600">Công nhân đã hoàn tất tưới nước và chụp ảnh hiện trường lúc 08:15 sáng nay.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 space-y-0.5">
                    <p className="font-bold">⏱ Nhắc nhở thu hoạch (Thửa B2)</p>
                    <p className="text-[11px] text-stone-600">Xà lách Romaine dự kiến đến ngày thu hoạch sau 3 ngày nữa.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Role Demo Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/5 hover:bg-black/10 text-[#294C3B] border border-black/10 flex items-center gap-1.5 transition-colors"
                title="Chuyển đổi Role Demo"
              >
                <Shield className="w-3.5 h-3.5 text-[#F5CF62]" />
                <span className="font-bold">CUSTOMER</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-brand-dark rounded-xl shadow-elevated border border-brand-border py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-brand-border/60">
                    <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                      Chuyển quyền thử nghiệm:
                    </p>
                  </div>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        switchRole(acc.role);
                        setRoleSwitcherOpen(false);
                        if (acc.role === 'ADMIN') {
                          navigate('/admin/dashboard');
                        } else if (acc.role === 'EXPERT') {
                          navigate('/expert/dashboard');
                        } else if (acc.role === 'STAFF') {
                          navigate('/staff/dashboard');
                        } else {
                          navigate('/customer/dashboard');
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-brand-cream/80 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-brand-dark">{acc.fullName}</p>
                        <p className="text-[11px] text-brand-muted">{acc.roleTitle}</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-cream text-brand-green border border-brand-border">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white border border-brand-border hover:bg-stone-50 transition-all shadow-sm"
              >
                <div className="relative">
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                    alt={user?.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-brand-green"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#F5CF62] text-brand-dark font-black text-[8px] flex items-center justify-center">
                    1
                  </span>
                </div>
                <span className="text-xs font-bold text-[#294C3B] max-w-[110px] truncate hidden sm:inline">
                  {user?.fullName || 'Lô Thái Quyền'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-brand-dark rounded-xl shadow-elevated border border-brand-border py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-brand-border/60">
                    <p className="font-bold text-brand-dark">{user?.fullName || 'Lô Thái Quyền'}</p>
                    <p className="text-[11px] text-stone-500 truncate">{user?.email || 'customer@farmely.vn'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Seedling • Level 1
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab && setActiveTab('profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-brand-cream transition-colors font-medium text-stone-700"
                  >
                    <User className="w-4 h-4 text-brand-green" />
                    <span>Hồ sơ cá nhân (Profile)</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab && setActiveTab('contracts');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-brand-cream transition-colors font-medium text-stone-700"
                  >
                    <FileText className="w-4 h-4 text-brand-green" />
                    <span>Lịch sử hợp đồng (Contract History)</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-semibold border-t border-brand-border/60 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg lg:hidden text-stone-600 hover:text-brand-dark"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-brand-border px-4 py-3 space-y-2 text-xs">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab && setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-bold text-stone-700 hover:text-brand-green flex items-center gap-2"
            >
              <item.icon className="w-4 h-4 text-brand-green" />
              <span>{item.label}</span>
            </button>
          ))}
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-brand-green border-t border-brand-border/60 pt-2"
          >
            Marketplace (Thuê thêm thửa đất)
          </Link>
        </div>
      )}
    </nav>
  );
}
