import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, ChevronDown, Menu, X, Shield, Sprout, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import Button from '../common/Button';

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout, switchRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

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
      case 'ADMIN': return '/admin/master-data';
      case 'EXPERT': return '/expert/dashboard';
      case 'STAFF': return '/staff/dashboard';
      case 'CUSTOMER': return '/customer/dashboard';
      default: return '/';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBackgroundClass}`}>
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LEFT: Brand Logo + Vertical Divider matching reference image */}
          <div className="flex items-center">
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

          {/* CENTER: Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 px-4">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors hover:text-brand-yellow ${
                location.pathname === '/' ? 'text-brand-yellow font-bold' : 'text-white/95'
              }`}
            >
              Trang chủ
            </Link>

            {/* Marketplace Link */}
            <Link
              to="/marketplace"
              className={`text-sm font-semibold transition-colors hover:text-brand-yellow ${
                location.pathname.startsWith('/marketplace') ? 'text-brand-yellow font-bold' : 'text-white/95'
              }`}
            >
              Marketplace
            </Link>

            {/* Về Farmely (Direct Link to /about + Hover Dropdown for sections) */}
            <div
              className="relative py-2 flex items-center"
              onMouseEnter={() => setAboutDropdownOpen(true)}
              onMouseLeave={() => setAboutDropdownOpen(false)}
            >
              <Link
                to="/about"
                className={`flex items-center gap-1.5 text-sm font-semibold hover:text-brand-yellow transition-colors ${
                  location.pathname === '/about' ? 'text-brand-yellow font-bold' : 'text-white/95'
                }`}
              >
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
          </div>

          {/* RIGHT: Customer Dashboard shortcut (if logged in) + Search + Role Switcher + Auth */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* If CUSTOMER is logged in, show quick shortcut to their Yards */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <Link
                to="/customer/dashboard"
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5CF62] text-brand-dark hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Sprout className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Vườn Của Tôi</span>
              </Link>
            )}

            {/* Search Icon */}
            <div className="flex items-center pr-2 border-r border-white/20 h-10">
              <Link
                to="/marketplace"
                className="p-2 text-white/90 hover:text-brand-yellow hover:bg-white/10 rounded-full transition-colors"
                title="Tìm kiếm thửa đất"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </Link>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="relative pl-4">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 flex items-center gap-1.5 transition-colors"
                title="Chuyển đổi Role Demo"
              >
                <Shield className="w-3.5 h-3.5 text-brand-yellow" />
                <span className="hidden sm:inline">Role:</span>
                <span className="text-brand-yellow font-bold">{user ? user.role : 'GUEST'}</span>
                <ChevronDown className="w-3 h-3" />
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
                  <div className="border-t border-brand-border/60 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                    >
                      Đăng xuất (Khách vãng lai / Guest)
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                    <img
                      src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                      alt={user?.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-white/40"
                    />
                    <span className="text-xs font-bold truncate max-w-[100px]">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-brand-dark rounded-xl shadow-elevated border border-brand-border py-2 z-50">
                      <div className="px-4 py-2 border-b border-brand-border/60">
                        <p className="text-xs font-bold text-brand-dark">{user?.fullName}</p>
                        <p className="text-[11px] text-brand-muted truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {user?.roleTitle || user?.role}
                        </span>
                      </div>

                      <Link
                        to={getDashboardRoute(user?.role)}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-brand-dark hover:bg-brand-cream transition-colors font-medium"
                      >
                        <User className="w-4 h-4 text-brand-green" />
                        Trang Dashboard {user?.role}
                      </Link>

                      <Link
                        to="/admin/master-data"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-brand-dark hover:bg-brand-cream transition-colors font-medium"
                      >
                        <Shield className="w-4 h-4 text-brand-green" />
                        Quản lý Master Data
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold border-t border-brand-border/60 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-dark/98 border-t border-white/15 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-white hover:text-brand-yellow"
          >
            Trang chủ
          </Link>

          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-white hover:text-brand-yellow"
          >
            Marketplace
          </Link>

          {isAuthenticated && user?.role === 'CUSTOMER' && (
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
              className="w-full text-left py-1.5 text-xs text-stone-200 hover:text-brand-yellow flex items-center gap-2"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Cách hoạt động (Quy trình 4 bước)</span>
            </button>
            <button
              type="button"
              onClick={() => handleScrollToSection('experience')}
              className="w-full text-left py-1.5 text-xs text-stone-200 hover:text-brand-yellow flex items-center gap-2"
            >
              <Sprout className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Trải nghiệm canh tác (Self & Assisted)</span>
            </button>
          </div>
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
    </nav>
  );
}
