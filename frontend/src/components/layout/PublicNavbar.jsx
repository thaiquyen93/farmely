import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, ChevronDown, Menu, X, Shield, Sprout, ClipboardCheck, ShieldCheck, Settings, LayoutDashboard, Check, Bell, Lock, Calendar, Clock, ExternalLink, Home, Info, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch, unwrapData } from '../../api/apiClient';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function PublicNavbar({ dashboardRailCollapsed, hideBrand = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const [notificationLoading, setNotificationLoading] = useState(false);

  // User Profile & Settings Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    emailNoti: true,
    smsNoti: true,
    weatherAlert: true,
    twoFactor: false
  });
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ old: false, next: false, confirm: false });
  const [settingsErrorMsg, setSettingsErrorMsg] = useState('');
  const [showSettingsPasswords, setShowSettingsPasswords] = useState(false);

  const { user, isAuthenticated, logout, updateUser, refreshUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Role flags for strictly scoped navigation (RBAC)
  const isCustomerOrGuest = !isAuthenticated || user?.role === 'CUSTOMER';
  const isStaff = isAuthenticated && user?.role === 'STAFF';
  const isExpert = isAuthenticated && user?.role === 'EXPERT';
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const hasDashboardRail = typeof dashboardRailCollapsed === 'boolean';

  // Sync profileForm with user on change
  useEffect(() => {
    if (user) {
      const savedProfile = JSON.parse(localStorage.getItem(`farmely_profile_${user.id || user.email}`) || '{}');
      const savedSettings = JSON.parse(localStorage.getItem(`farmely_settings_${user.id || user.email}`) || '{}');
      setProfileForm({
        fullName: user.fullName || '',
        phone: savedProfile.phone ?? user.phone ?? '',
        address: savedProfile.address ?? user.address ?? '',
        bio: savedProfile.bio ?? user.bio ?? ''
      });
      setSettingsForm((current) => ({ ...current, ...savedSettings }));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && typeof refreshUser === 'function') {
      refreshUser().catch(() => {});
    }
  }, [isAuthenticated, refreshUser]);

  const toggleNotifications = async () => {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);
    if (!nextOpen || !user?.userId) return;
    setNotificationLoading(true);
    setNotificationError('');
    try {
      setNotifications(unwrapData(await apiFetch(`/api/v1/notifications?userId=${user.userId}`)) || []);
    } catch (error) {
      setNotifications([]);
      setNotificationError(error.message);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileErrorMsg('');
    try {
      if (!user?.userId) throw new Error('Phiên đăng nhập không có mã người dùng.');
      const updated = unwrapData(await apiFetch(`/api/users/${user.userId}`, {
        method: 'PUT',
        body: JSON.stringify({ fullName: profileForm.fullName, phoneNumber: profileForm.phone, address: profileForm.address })
      }));
      updateUser(updated);
      setProfileSuccessMsg('Đã cập nhật thông tin hồ sơ thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (error) {
      setProfileErrorMsg(`Không thể cập nhật hồ sơ: ${error.message}`);
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setSettingsErrorMsg('');
    if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSettingsErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      if (passwordForm.newPassword) {
        if (passwordForm.newPassword.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        if (!user?.userId) throw new Error('Hãy đăng nhập bằng tài khoản hệ thống để đổi mật khẩu.');
        await apiFetch(`/api/users/${user.userId}/password`, {
          method: 'PUT',
          body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
        });
      }
      localStorage.setItem(`farmely_settings_${user?.userId || user?.id || 'guest'}`, JSON.stringify(settingsForm));
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setSettingsSuccessMsg('Mật khẩu đã đồng bộ; các tùy chọn thông báo được lưu cục bộ trên thiết bị này.');
      setTimeout(() => setSettingsSuccessMsg(''), 3000);
    } catch (error) {
      setSettingsErrorMsg(error.message);
    }
  };

  const handleScrollToSection = (sectionId) => {
    setAboutDropdownOpen(false);
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const navBackgroundClass = isHome && !isScrolled
    ? 'bg-transparent border-b border-white/15 text-white'
    : 'bg-[#294C3B]/95 backdrop-blur-md border-b border-white/10 text-white shadow-lg';

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'EXPERT': return '/expert/dashboard';
      case 'STAFF': return '/staff/dashboard';
      case 'CUSTOMER': return '/customer/dashboard';
      default: return '/';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-[left] duration-200 ${hasDashboardRail ? (dashboardRailCollapsed ? 'lg:left-16' : 'lg:left-72') : ''} ${navBackgroundClass}`}>
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LEFT: Brand Logo + Vertical Divider matching reference image */}
          <div className={hideBrand ? 'hidden' : 'flex items-center'}>
            <Link to="/" className="flex items-center gap-2.5 group pr-6 lg:pr-8 lg:border-r lg:border-white/20 h-12">
              <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm group-hover:scale-105 transition-transform">
                <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-black tracking-wider text-white">
                  FARMELY
                </span>
                <span className="text-[9px] tracking-widest text-brand-yellow uppercase font-bold -mt-1 hidden sm:block">
                  Smart Agriculture
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: Navigation Links (Tách biệt nghiêm ngặt theo vai trò / RBAC) */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-2 xl:flex 2xl:gap-5 2xl:px-4">
            {/* 1. KHÁCH HÀNG & KHÁCH VÃNG LAI (CUSTOMER / GUEST) */}
            {isCustomerOrGuest && (
              <>
                <Link
                  to="/"
                  className={`whitespace-nowrap text-xs 2xl:text-sm font-semibold transition-colors hover:text-brand-yellow ${
                    location.pathname === '/' ? 'text-brand-yellow font-bold' : 'text-white/95'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />Trang chủ</span>
                </Link>

                <Link
                  to="/marketplace"
                  className={`whitespace-nowrap text-xs 2xl:text-sm font-semibold transition-colors hover:text-brand-yellow ${
                    location.pathname.startsWith('/marketplace') ? 'text-brand-yellow font-bold' : 'text-white/95'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />Marketplace</span>
                </Link>

                <Link
                  to="/site-visit/book"
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs 2xl:text-sm font-semibold transition-colors hover:text-brand-yellow ${
                    location.pathname.startsWith('/site-visit') ? 'text-brand-yellow font-bold' : 'text-white/95'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Đặt lịch tham quan</span>
                </Link>

                {isAuthenticated && !location.pathname.startsWith('/marketplace') && (
                  <Link
                    to="/customer/dashboard"
                    className={`flex items-center gap-1.5 whitespace-nowrap text-xs 2xl:text-sm font-semibold transition-colors hover:text-brand-yellow ${
                      location.pathname.includes('/customer/dashboard') ? 'text-brand-yellow font-bold' : 'text-white/95'
                    }`}
                  >
                    <Sprout className="w-4 h-4 text-brand-yellow" />
                    <span>Vườn của tôi</span>
                  </Link>
                )}

                {/* Về Farmely (Direct Link to /about + Hover Dropdown for sections) */}
                <div
                  className="relative py-2 flex items-center"
                  onMouseEnter={() => setAboutDropdownOpen(true)}
                  onMouseLeave={() => setAboutDropdownOpen(false)}
                >
                  <Link
                    to="/about"
                    className={`flex items-center gap-1.5 whitespace-nowrap text-xs 2xl:text-sm font-semibold hover:text-brand-yellow transition-colors ${
                      location.pathname === '/about' ? 'text-brand-yellow font-bold' : 'text-white/95'
                    }`}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Về Farmely</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        aboutDropdownOpen ? 'rotate-180 text-brand-yellow' : 'text-white/70'
                      }`}
                    />
                  </Link>

                  {/* Dropdown Menu */}
                  {aboutDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 z-50 animate-fadeIn">
                      <div className="bg-brand-dark/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 space-y-1 text-left">
                        <Link
                          to="/about"
                          onClick={() => setAboutDropdownOpen(false)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors group flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-yellow group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-brand-yellow transition-colors">
                              Giới thiệu Farmely
                            </p>
                            <p className="text-[11px] text-stone-300 line-clamp-1">
                              Tầm nhìn, sứ mệnh & 4 trụ cột vận hành
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleScrollToSection('how-it-works')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors group flex items-start gap-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-yellow group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <ClipboardCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-brand-yellow transition-colors">
                              Cách hoạt động
                            </p>
                            <p className="text-[11px] text-stone-300 line-clamp-1">
                              Quy trình khép kín 4 bước canh tác
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleScrollToSection('experience')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors group flex items-start gap-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-yellow group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Sprout className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-brand-yellow transition-colors">
                              Trải nghiệm canh tác
                            </p>
                            <p className="text-[11px] text-stone-300 line-clamp-1">
                              Tự canh tác (Self) hoặc Ủy thác (Assisted)
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2. CHUYÊN VIÊN LAO ĐỘNG (STAFF) */}
            {isStaff && (
              <>
                <Link
                  to="/staff/dashboard"
                  className={`text-sm font-bold transition-all flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${
                    location.pathname.includes('/staff/dashboard')
                      ? 'bg-amber-400 text-brand-dark shadow-sm'
                      : 'text-white/95 hover:text-brand-yellow hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Ca Trực Hiện Trường</span>
                </Link>

                <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-brand-yellow border border-amber-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Khu Vực Tác Nghiệp: Chuyên Viên Lao Động</span>
                </div>

                <Link
                  to="/"
                  className="text-xs text-stone-300 hover:text-brand-yellow transition-colors flex items-center gap-1 ml-2"
                  title="Xem Cổng thông tin công khai Farmely"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">Cổng công khai</span>
                </Link>
              </>
            )}

            {/* 3. CHUYÊN GIA NÔNG NGHIỆP (EXPERT) */}
            {isExpert && (
              <>
                <Link
                  to="/expert/dashboard"
                  className={`text-sm font-bold transition-all flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${
                    location.pathname.includes('/expert/dashboard')
                      ? 'bg-brand-yellow text-brand-dark shadow-sm'
                      : 'text-white/95 hover:text-brand-yellow hover:bg-white/10'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Bàn Làm Việc Chuyên Gia</span>
                </Link>

                <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Giám Sát Canh Tác & Chuẩn VietGAP</span>
                </div>

                <Link
                  to="/"
                  className="text-xs text-stone-300 hover:text-brand-yellow transition-colors flex items-center gap-1 ml-2"
                  title="Xem Cổng thông tin công khai Farmely"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">Cổng công khai</span>
                </Link>
              </>
            )}

            {/* 4. QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN) */}
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`text-sm font-bold transition-all flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${
                    location.pathname === '/admin/dashboard'
                      ? 'bg-brand-yellow text-brand-dark shadow-sm'
                      : 'text-white/95 hover:text-brand-yellow hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Bảng Quản Trị</span>
                </Link>

                <Link
                  to="/admin/master-data"
                  className={`text-sm font-bold transition-all flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${
                    location.pathname.startsWith('/admin/master-data')
                      ? 'bg-brand-yellow text-brand-dark shadow-sm'
                      : 'text-white/95 hover:text-brand-yellow hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dữ Liệu Nền Tảng (Master Data)</span>
                </Link>

                <Link
                  to="/"
                  className="text-xs text-stone-300 hover:text-brand-yellow transition-colors flex items-center gap-1 ml-2"
                  title="Xem Cổng thông tin công khai Farmely"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Cổng công khai</span>
                </Link>
              </>
            )}
          </div>

          {/* RIGHT: Customer Dashboard shortcut (if logged in) + Search + Role Switcher + Auth */}
          <div className="hidden shrink-0 items-center gap-2 md:flex 2xl:gap-3">

            {/* Search Icon (Chỉ hiển thị cho Customer hoặc Guest tìm kiếm đất) */}
            {isCustomerOrGuest && (
              <div className="flex items-center pr-2 border-r border-white/20 h-10">
                <Link
                  to="/marketplace"
                  className="p-2 text-white/90 hover:text-brand-yellow hover:bg-white/10 rounded-full transition-colors"
                  title="Tìm kiếm thửa đất"
                >
                  <Search className="w-5 h-5 stroke-[2.2]" />
                </Link>
              </div>
            )}

            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <div className="relative">
                <button type="button" onClick={toggleNotifications} className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-brand-yellow" aria-label="Thông báo">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[#294C3B] bg-orange-400" />
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 z-[70] mt-3 w-80 rounded-2xl border border-brand-border bg-white p-3 text-brand-dark shadow-elevated">
                    <div className="flex items-center justify-between border-b border-brand-border pb-2"><p className="text-xs font-black">Thông báo gần đây</p><span className="text-[10px] font-bold text-emerald-600">{notifications.length} thông báo</span></div>
                    <div className="mt-2 space-y-1">
                      {notificationLoading && <p className="p-3 text-xs text-brand-muted">Đang tải thông báo...</p>}
                      {notificationError && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{notificationError}</p>}
                      {!notificationLoading && !notificationError && notifications.length === 0 && <p className="p-3 text-xs text-brand-muted">Chưa có thông báo.</p>}
                      {notifications.map((notice) => <div key={notice.notificationId || notice.id} className="rounded-xl bg-stone-50 p-3 text-left"><p className="text-xs font-bold text-stone-800">{notice.title}</p><p className="mt-1 text-[10px] text-stone-600">{notice.content}</p></div>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <div className="hidden items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90 2xl:flex" aria-label={`Vai trò ${user?.role}`}>
                <Shield className="w-3.5 h-3.5 text-brand-yellow" />
                <span className="font-bold text-brand-yellow">{user?.role}</span>
              </div>
            )}

            {/* Auth Button or User Menu */}
            <div className="pl-3">
              {!isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="outline-light" size="sm" className="px-3 py-1.5 text-xs">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="px-3 py-1.5 text-xs">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-brand-cream text-[10px] font-black text-brand-dark">
                      {(user?.fullName || 'U').trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[100px]">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-brand-dark rounded-2xl shadow-elevated border border-brand-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                      {/* User Header */}
                      <div className="px-4 py-2.5 border-b border-brand-border/60">
                        <p className="font-bold text-brand-dark text-sm truncate">{user?.fullName || 'Người dùng'}</p>
                        <p className="text-[11px] text-brand-muted truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {user?.roleTitle || (user?.role === 'CUSTOMER' ? 'Khách hàng thuê đất' : user?.role === 'ADMIN' ? 'Quản trị viên hệ thống' : user?.role === 'EXPERT' ? 'Chuyên gia nông nghiệp' : 'Chuyên viên lao động')}
                        </span>
                      </div>

                      <div className="py-1">
                        {/* 1. Dashboard Link theo Role */}
                        <Link
                          to={getDashboardRoute(user?.role)}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-cream transition-colors font-medium text-stone-700 hover:text-brand-dark cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-green" />
                          <span>
                            {user?.role === 'CUSTOMER'
                              ? 'Vườn Của Tôi (Dashboard)'
                              : user?.role === 'ADMIN'
                              ? 'Bảng Quản Trị Hệ Thống'
                              : user?.role === 'EXPERT'
                              ? 'Bàn Làm Việc Chuyên Gia'
                              : 'Ca Trực Hiện Trường'}
                          </span>
                        </Link>

                        {/* 2. Hồ sơ cá nhân (User Profile) */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-cream transition-colors font-medium text-stone-700 hover:text-brand-dark cursor-pointer"
                        >
                          <User className="w-4 h-4 text-brand-green" />
                          <span>Hồ sơ cá nhân</span>
                        </button>

                        {user?.role === 'CUSTOMER' && (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              navigate('/customer/dashboard?view=contracts');
                            }}
                            className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-cream transition-colors font-medium text-stone-700 hover:text-brand-dark cursor-pointer"
                          >
                            <ClipboardCheck className="w-4 h-4 text-brand-green" />
                            <span>Hợp đồng & lịch sử thuê</span>
                          </button>
                        )}

                        {/* 3. Cài đặt tài khoản (Settings) */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setIsSettingsModalOpen(true);
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-cream transition-colors font-medium text-stone-700 hover:text-brand-dark cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-brand-green" />
                          <span>Cài đặt tài khoản</span>
                        </button>

                        {/* 4. CHỈ ADMIN MỚI THẤY Quản lý Master Data */}
                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin/master-data"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-amber-50 transition-colors font-medium text-amber-800 border-t border-brand-border/40 mt-1 pt-2 cursor-pointer"
                          >
                            <Shield className="w-4 h-4 text-amber-600" />
                            <span>Quản lý Master Data</span>
                          </Link>
                        )}
                      </div>

                      {/* 5. Đăng xuất */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors font-semibold border-t border-brand-border/60 mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer (Tách biệt theo vai trò) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-brand-dark/98 border-t border-white/15 px-4 pt-3 pb-6 space-y-3">
          {/* KHÁCH HÀNG & GUEST */}
          {isCustomerOrGuest && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-white hover:text-brand-yellow"
              >
                <Home className="h-4 w-4 text-brand-yellow" />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-white hover:text-brand-yellow"
              >
                <ShoppingCart className="h-4 w-4 text-brand-yellow" />
                <span>Marketplace</span>
              </Link>

              <Link
                to="/site-visit/book"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-white hover:text-brand-yellow flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-brand-yellow" />
                <span>Đặt lịch tham quan</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold text-brand-yellow flex items-center gap-2"
                >
                  <Sprout className="w-4 h-4" />
                  <span>Vườn Của Tôi (Dashboard)</span>
                </Link>
              )}

              <div className="py-1 px-2 rounded-xl bg-white/5 space-y-1">
                <p className="text-[11px] font-bold text-brand-yellow uppercase tracking-wider py-1">
                  Về Farmely:
                </p>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left py-1.5 text-xs text-stone-200 hover:text-brand-yellow flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Giới thiệu Farmely (Tầm nhìn & Trụ cột)</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleScrollToSection('how-it-works')}
                  className="w-full text-left py-1.5 text-xs text-stone-200 hover:text-brand-yellow flex items-center gap-2 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Cách hoạt động (Quy trình 4 bước)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollToSection('experience')}
                  className="w-full text-left py-1.5 text-xs text-stone-200 hover:text-brand-yellow flex items-center gap-2 cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Trải nghiệm canh tác (Self & Assisted)</span>
                </button>
              </div>
            </>
          )}

          {/* CHUYÊN VIÊN LAO ĐỘNG (STAFF) */}
          {isStaff && (
            <div className="space-y-2">
              <Link
                to="/staff/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-amber-300 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Ca Trực Hiện Trường (CVLĐ)</span>
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-stone-300 hover:text-brand-yellow flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Cổng thông tin công khai</span>
              </Link>
            </div>
          )}

          {/* CHUYÊN GIA NÔNG NGHIỆP (EXPERT) */}
          {isExpert && (
            <div className="space-y-2">
              <Link
                to="/expert/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-brand-yellow flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Bàn Làm Việc Chuyên Gia (CGNN)</span>
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-stone-300 hover:text-brand-yellow flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Cổng thông tin công khai</span>
              </Link>
            </div>
          )}

          {/* QUẢN TRỊ VIÊN (ADMIN) */}
          {isAdmin && (
            <div className="space-y-2">
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-brand-yellow flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Bảng Quản Trị Hệ Thống</span>
              </Link>
              <Link
                to="/admin/master-data"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-stone-200 hover:text-brand-yellow flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                <span>Quản Trị Master Data</span>
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-stone-300 hover:text-brand-yellow flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Cổng thông tin công khai</span>
              </Link>
            </div>
          )}
          <div className="pt-3 border-t border-white/15 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline-light" size="sm" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Đăng ký
                  </Button>
                </Link>
              </>
            ) : (
              <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
                Đăng xuất ({user?.fullName})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileSuccessMsg('');
        }}
        title="Hồ Sơ Cá Nhân"
        subtitle="Thông tin tài khoản của bạn"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem(`farmely_profile_${user.id || user.email}`, JSON.stringify(profileForm));
            updateUser({ fullName: profileForm.fullName, phone: profileForm.phone, address: profileForm.address, bio: profileForm.bio });
            setProfileSuccessMsg('Đã cập nhật thông tin hồ sơ thành công!');
            setTimeout(() => setProfileSuccessMsg(''), 3000);
          }}
          className="space-y-4 text-xs text-left"
        >
          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}
          {profileErrorMsg && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-bold text-rose-700">{profileErrorMsg}</div>}

          <div className="flex items-center gap-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-yellow bg-white text-lg font-black text-brand-dark shadow-sm">
              {(user?.fullName || 'U').trim().charAt(0).toUpperCase()}
            </span>
            <div className="space-y-1">
              <p className="font-bold text-brand-dark text-sm">{profileForm.fullName || user?.fullName || 'Người dùng'}</p>
              <p className="text-stone-500 text-[11px]">{user?.email}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {user?.roleTitle || (user?.role === 'CUSTOMER' ? 'Khách hàng thuê đất' : user?.role === 'ADMIN' ? 'Quản trị viên hệ thống' : user?.role === 'EXPERT' ? 'Chuyên gia nông nghiệp' : 'Chuyên viên lao động')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Họ và tên:</label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Số điện thoại liên hệ:</label>
              <input
                type="text"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">{user?.role === 'CUSTOMER' ? 'Địa chỉ giao nhận nông sản:' : 'Địa chỉ liên hệ:'}</label>
            <input
              type="text"
              required
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          {user?.role === 'CUSTOMER' && (
            <button type="button" onClick={() => { setIsProfileModalOpen(false); navigate('/customer/dashboard?view=contracts'); }} className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:bg-emerald-100">
              <div className="flex items-center gap-2 font-bold text-emerald-900"><ClipboardCheck className="h-4 w-4" /> Hợp đồng thuê của tôi</div>
              <p className="mt-1 text-[11px] text-emerald-800">Quản lý thời hạn, thửa đang thuê và quyền lợi trong hồ sơ khách hàng.</p>
            </button>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(false)}
            >
              Đóng
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSettingsSuccessMsg('');
        }}
        title="Cài Đặt Tài Khoản"
        subtitle="Quản lý tùy chọn thông báo, ngôn ngữ và bảo mật"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem(`farmely_settings_${user.id || user.email}`, JSON.stringify(settingsForm));
            setSettingsSuccessMsg('Đã lưu cấu hình cài đặt tài khoản thành công!');
            setTimeout(() => setSettingsSuccessMsg(''), 3000);
          }}
          className="space-y-4 text-xs text-left"
        >
          {settingsSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span>{settingsSuccessMsg}</span>
            </div>
          )}
          {settingsErrorMsg && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-bold text-rose-700">{settingsErrorMsg}</div>}

          {/* Section 1: Notifications */}
          <div className="space-y-2">
            <h5 className="font-bold text-brand-dark text-xs uppercase tracking-wider text-stone-500">
              Thông Báo & Cảnh Báo Mùa Vụ
            </h5>
            <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <p className="rounded-lg bg-amber-50 p-2 text-[10px] font-semibold text-amber-800">Các tùy chọn dưới đây là thiết lập cục bộ trên trình duyệt; backend chưa có API đồng bộ.</p>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="relative">
                  <span className="font-bold text-brand-dark block">Thông báo qua Email</span>
                  <span className="text-stone-500 text-[11px]">Nhận báo cáo tiến độ mùa vụ và nhật ký canh tác thực địa</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.emailNoti}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emailNoti: e.target.checked })}
                  className="w-4 h-4 accent-brand-green rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-stone-200/60">
                <div>
                  <span className="font-bold text-brand-dark block">SMS Cảnh Báo Thu Hoạch</span>
                  <span className="text-stone-500 text-[11px]">Tin nhắn SMS khi nông sản sẵn sàng thu hái hoặc giao hàng</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.smsNoti}
                  onChange={(e) => setSettingsForm({ ...settingsForm, smsNoti: e.target.checked })}
                  className="w-4 h-4 accent-brand-green rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-stone-200/60">
                <div>
                  <span className="font-bold text-brand-dark block">Cảnh Báo Biến Động Vi Khí Hậu</span>
                  <span className="text-stone-500 text-[11px]">Thông báo ngay khi độ ẩm hoặc nhiệt độ đất vượt ngưỡng chuẩn</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.weatherAlert}
                  onChange={(e) => setSettingsForm({ ...settingsForm, weatherAlert: e.target.checked })}
                  className="w-4 h-4 accent-brand-green rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Security & Password */}
          <div className="space-y-2">
            <h5 className="font-bold text-brand-dark text-xs uppercase tracking-wider text-stone-500">
              Bảo Mật & Mật Khẩu
            </h5>
            <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Mật khẩu hiện tại:</label>
                  <input
                    type={showSettingsPasswords ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.oldPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })}
                    className="w-full p-2 pr-12 rounded-lg border border-brand-border bg-white text-xs"
                  />
                  <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, old: !s.old }))} className="absolute right-2 top-8 p-1 text-stone-500">{showPasswords.old ? 'Ẩn' : 'Hiện'}</button>
                </div>
                <div className="relative">
                  <label className="block font-medium text-stone-700 mb-1">Mật khẩu mới:</label>
                  <div className="relative"><input type={showPasswords.next ? 'text' : 'password'} placeholder="••••••••" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="w-full p-2 pr-12 rounded-lg border border-brand-border bg-white text-xs" /><button type="button" onClick={() => setShowPasswords((s) => ({ ...s, next: !s.next }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-500">{showPasswords.next ? 'Ẩn' : 'Hiện'}</button></div>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Xác nhận mật khẩu:</label>
                  <input
                    type={showSettingsPasswords ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                    className="w-full p-2 pr-12 rounded-lg border border-brand-border bg-white text-xs"
                  />
                  <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))} className="absolute right-2 top-8 p-1 text-stone-500">{showPasswords.confirm ? 'Ẩn' : 'Hiện'}</button>
                </div>
              </div>
              <button type="button" onClick={() => setShowSettingsPasswords((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-bold text-brand-green hover:bg-emerald-50">
                {showSettingsPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSettingsPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
              <label className="flex items-center justify-between cursor-pointer pt-1.5 border-t border-stone-200/60">
                <span className="text-stone-700 font-medium">Bật xác thực hai yếu tố (2FA) qua ứng dụng</span>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  readOnly
                  className="w-4 h-4 accent-brand-green rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsModalOpen(false)}
            >
              Đóng
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Cài Đặt
            </Button>
          </div>
        </form>
      </Modal>
    </nav>
  );
}
