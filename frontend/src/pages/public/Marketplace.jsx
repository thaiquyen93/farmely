import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import MarketplaceFilterSidebar from '../../components/marketplace/MarketplaceFilterSidebar';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import {
  FARMS_GIS_DATA,
  MARKETPLACE_PLOTS_GIS,
  ALL_CROPS_FILTER_OPTIONS
} from '../../data/marketplaceGisData';
import {
  SlidersHorizontal,
  X,
  LogIn,
  Search,
  MapPin,
  Sprout,
  RotateCcw,
  ChevronDown,
  Layers,
  Shield,
  Sparkles,
  Compass,
  Maximize2
} from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [priceMax, setPriceMax] = useState(10000000);
  const [facilities, setFacilities] = useState({
    irrigation: false,
    iot: false,
    waterSource: false,
    organicSoil: false,
    techSupport: false
  });
  const [activeStatusTab, setActiveStatusTab] = useState('ALL');
  const [activeHudTab, setActiveHudTab] = useState('PLOTS'); // 'PLOTS' | 'BOUNDARIES' | 'SOIL'
  const [selectedPlotId, setSelectedPlotId] = useState('PLT-HV-01');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('landId')) setSelectedLocation(searchParams.get('landId'));
    if (searchParams.get('crop')) setSelectedCrop(searchParams.get('crop'));
  }, [searchParams]);

  const toggleFacility = (key) => setFacilities((p) => ({ ...p, [key]: !p[key] }));

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('ALL');
    setSelectedCrop('ALL');
    setAreaMin('');
    setAreaMax('');
    setPriceMax(10000000);
    setFacilities({
      irrigation: false,
      iot: false,
      waterSource: false,
      organicSoil: false,
      techSupport: false
    });
    setActiveStatusTab('ALL');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedLocation !== 'ALL' ||
      selectedCrop !== 'ALL' ||
      areaMin ||
      areaMax ||
      priceMax < 10000000 ||
      Object.values(facilities).some(Boolean) ||
      activeStatusTab !== 'ALL'
  );

  const currentFarm = useMemo(
    () =>
      selectedLocation === 'ALL'
        ? FARMS_GIS_DATA[0]
        : FARMS_GIS_DATA.find((f) => f.id === selectedLocation) || FARMS_GIS_DATA[0],
    [selectedLocation]
  );

  const filteredPlots = useMemo(
    () =>
      MARKETPLACE_PLOTS_GIS.filter((p) => {
        if (activeStatusTab !== 'ALL' && p.status !== activeStatusTab) return false;
        if (selectedLocation !== 'ALL' && p.farmId !== selectedLocation) return false;
        if (selectedCrop !== 'ALL') {
          const m = p.crop.toLowerCase().includes(selectedCrop.toLowerCase());
          const mc = p.compatibleCrops?.some((c) =>
            c.name.toLowerCase().includes(selectedCrop.toLowerCase())
          );
          if (!m && !mc) return false;
        }
        if (areaMin && p.area < Number(areaMin)) return false;
        if (areaMax && p.area > Number(areaMax)) return false;
        if (priceMax && p.rentalPrice > priceMax) return false;
        if (facilities.irrigation && !p.facilities?.irrigation) return false;
        if (facilities.iot && !p.facilities?.iot) return false;
        if (facilities.waterSource && !p.facilities?.waterSource) return false;
        if (facilities.organicSoil && !p.facilities?.organicSoil) return false;
        if (facilities.techSupport && !p.facilities?.techSupport) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (![p.code, p.name, p.farmName, p.crop].some((s) => s.toLowerCase().includes(q)))
            return false;
        }
        return true;
      }),
    [activeStatusTab, selectedLocation, selectedCrop, areaMin, areaMax, priceMax, facilities, searchQuery]
  );

  const statusCounts = useMemo(() => {
    const c = {
      ALL: MARKETPLACE_PLOTS_GIS.length,
      AVAILABLE: 0,
      RENTED: 0,
      MAINTENANCE: 0,
      UPCOMING: 0
    };
    MARKETPLACE_PLOTS_GIS.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, []);

  const selectedPlot = useMemo(
    () =>
      filteredPlots.find((p) => p.id === selectedPlotId) ||
      MARKETPLACE_PLOTS_GIS.find((p) => p.id === selectedPlotId) ||
      filteredPlots[0] ||
      null,
    [selectedPlotId, filteredPlots]
  );

  const handleSelectPlot = (plot) => {
    setSelectedPlotId(plot.id);
    setShowRightDrawer(true);
    if (window.innerWidth < 1024) setShowMobileDetail(true);
  };

  const handleBookPlot = (plot) => {
    if (!plot || plot.status !== 'AVAILABLE') return;
    if (!isAuthenticated) {
      setPlotToBook(plot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${plot.id}/book`);
    }
  };

  const handleQuickDemoLogin = () => {
    login(DEMO_ACCOUNTS.customer);
    setShowAuthModal(false);
    if (plotToBook) navigate(`/marketplace/plot/${plotToBook.id}/book`);
  };

  const STATUS_TABS = [
    { key: 'ALL', label: 'Tất cả', count: statusCounts.ALL, dot: 'bg-emerald-600' },
    { key: 'AVAILABLE', label: 'Đang trống', count: statusCounts.AVAILABLE, dot: 'bg-emerald-500' },
    { key: 'RENTED', label: 'Đã thuê', count: statusCounts.RENTED, dot: 'bg-amber-500' },
    { key: 'MAINTENANCE', label: 'Bảo trì', count: statusCounts.MAINTENANCE, dot: 'bg-slate-400' }
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none bg-stone-900 text-slate-800">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. FULL-SCREEN SATELLITE GIS MAP BACKGROUND (100% Viewport)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MarketplaceInteractiveMap
          plots={filteredPlots}
          selectedPlot={selectedPlot}
          onSelectPlot={handleSelectPlot}
          currentFarm={currentFarm}
          activeStatusTab={activeStatusTab}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. MINIMAL FLOATING TOP BAR (Logo + Search + Nav + Auth)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="absolute top-3 left-4 right-4 z-30 pointer-events-auto">
        <div className="w-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/90 rounded-2xl px-4 py-2 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-black tracking-wider text-slate-900 leading-none">
                FARMELY
              </span>
              <span className="text-[7.5px] tracking-[0.2em] text-emerald-700 uppercase font-black mt-0.5">
                Smart Agriculture
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-5">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/marketplace"
              className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Marketplace
            </Link>
            <Link
              to="/about"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              Về Farmely
            </Link>
          </nav>

          {/* Right: Search, Role Badge & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Search Input Box */}
            <div className="relative hidden sm:block w-44 lg:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã thửa, cây trồng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none text-slate-800 placeholder-slate-400 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Role Badge */}
            <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>Role: {isAuthenticated ? user?.role || 'CUSTOMER' : 'GUEST'}</span>
            </div>

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1 rounded-xl text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Vườn của tôi</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. TOP-LEFT FLOATING HUD CARD (Matching exact GIF frame 0 / frame 2)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-[4.5rem] left-4 z-20 flex flex-col gap-2 max-w-[390px] pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 space-y-3">
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#00E5A3]" />
              Tổng quan đất nông nghiệp
            </span>
            <span className="text-[10px] font-mono text-slate-400">GIS v2.4</span>
          </div>

          {/* Row 1: 3 Toggle Filter Tabs (matching GIF) */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'PLOTS', label: 'Thửa đất' },
              { key: 'BOUNDARIES', label: 'Ranh giới' },
              { key: 'SOIL', label: 'Thổ nhưỡng' }
            ].map((tab) => {
              const active = activeHudTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveHudTab(tab.key)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
                    active
                      ? 'border-2 border-[#00E5A3] bg-emerald-50/50 text-[#059669] shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: 3 KPI Metric Columns (matching GIF) */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
            <div>
              <span className="text-lg font-black text-slate-900 block leading-tight">16</span>
              <span className="text-[10px] font-medium text-slate-500">Thửa đất</span>
            </div>
            <div>
              <span className="text-lg font-black text-[#059669] block leading-tight">146 ha</span>
              <span className="text-[10px] font-medium text-slate-500">Tổng diện tích</span>
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 block leading-tight">2024</span>
              <span className="text-[10px] font-medium text-slate-500">Năm canh tác</span>
            </div>
          </div>

          {/* Row 3: Status Filter Pills */}
          <div className="flex items-center gap-1 pt-1 border-t border-slate-100 flex-wrap">
            {STATUS_TABS.map((t) => {
              const on = activeStatusTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveStatusTab(t.key)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    on
                      ? 'bg-[#059669] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-white' : t.dot}`} />
                  <span>{t.label}</span>
                  <span className={on ? 'text-white/80' : 'text-slate-400'}>{t.count}</span>
                </button>
              );
            })}

            {/* Advanced Filter Drawer Trigger */}
            <button
              type="button"
              onClick={() => setShowFilterDrawer(true)}
              className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Bộ lọc nâng cao"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. RIGHT SLIDE-OVER DETAIL DRAWER (Matching exact GIF right drawer)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showRightDrawer && (
        <aside className="hidden md:block absolute top-[4.5rem] right-4 bottom-4 w-[380px] z-30 pointer-events-auto transition-transform duration-300">
          <MarketplacePlotDetailPanel
            plot={selectedPlot}
            onBookPlot={handleBookPlot}
            onFocusOnMap={() => {}}
            onClose={() => setShowRightDrawer(false)}
          />
        </aside>
      )}

      {/* Re-open Drawer Toggle Button when closed */}
      {!showRightDrawer && (
        <button
          type="button"
          onClick={() => setShowRightDrawer(true)}
          className="hidden md:flex absolute top-[4.5rem] right-4 z-20 px-3.5 py-2 rounded-xl bg-white shadow-xl border border-slate-200/90 text-xs font-bold text-slate-800 items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all pointer-events-auto"
        >
          <Sparkles className="w-4 h-4 text-[#00E5A3]" />
          <span>Xem chi tiết {selectedPlot?.code || 'P-01'}</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MOBILE QUICK ACCESS BAR (Screens < lg)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md shadow-xl border border-slate-200 p-2.5 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5A3] animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              {selectedPlot?.code || '16 Thửa đất'}
            </span>
          </div>
          {selectedPlot && (
            <button
              type="button"
              onClick={() => setShowMobileDetail(true)}
              className="py-2 px-4 rounded-xl bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Xem chi tiết</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. MODALS & DRAWERS
      ───────────────────────────────────────────────────────────────────────────── */}
      {/* Advanced Filter Slide-over Drawer */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md bg-white text-slate-800 h-full overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-black text-lg text-[#059669] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#00E5A3]" />
                  <span>Bộ Lọc Nâng Cao</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lọc thửa đất theo tiêu chuẩn diện tích, giá thuê, tiện ích VietGAP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MarketplaceFilterSidebar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedCrop={selectedCrop}
              setSelectedCrop={setSelectedCrop}
              areaMin={areaMin}
              setAreaMin={setAreaMin}
              areaMax={areaMax}
              setAreaMax={setAreaMax}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              facilities={facilities}
              toggleFacility={toggleFacility}
              availableCrops={ALL_CROPS_FILTER_OPTIONS}
              locations={FARMS_GIS_DATA}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={handleResetFilters}
              >
                Xóa tất cả
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold uppercase tracking-wider bg-[#059669] hover:bg-[#047857] text-white"
                onClick={() => setShowFilterDrawer(false)}
              >
                Áp dụng ({filteredPlots.length} thửa)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Detail Bottom Sheet */}
      {showMobileDetail && selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm md:hidden pointer-events-auto">
          <div className="w-full max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-heading font-black text-base text-slate-900">
                Chi Tiết {selectedPlot.code}
              </span>
              <button
                type="button"
                onClick={() => setShowMobileDetail(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MarketplacePlotDetailPanel
              plot={selectedPlot}
              onBookPlot={(p) => {
                setShowMobileDetail(false);
                handleBookPlot(p);
              }}
              onFocusOnMap={() => setShowMobileDetail(false)}
              onClose={() => setShowMobileDetail(false)}
            />
          </div>
        </div>
      )}

      {/* Auth Modal for Rental Booking */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Yêu Cầu Đăng Nhập Để Thuê Thửa Đất"
        subtitle={plotToBook ? `${plotToBook.code} • ${plotToBook.name}` : undefined}
      >
        <div className="space-y-4 text-center py-2 text-slate-800">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="font-heading font-bold text-base text-slate-900">
              Đăng nhập tài khoản Farmely
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Bạn cần đăng nhập tài khoản khách hàng để tiến hành ký hợp đồng thuê thửa đất, chọn hình
              thức chăm sóc (Assisted/Self) và thanh toán VietQR.
            </p>
          </div>

          {plotToBook && (
            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs border border-slate-200 space-y-1">
              <p>
                <strong>Thửa đất:</strong> {plotToBook.code} ({plotToBook.farmName})
              </p>
              <p>
                <strong>Diện tích:</strong> {plotToBook.areaFormatted}
              </p>
              <p>
                <strong>Giá thuê:</strong> {plotToBook.rentalPriceFormatted}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              className="w-full font-bold uppercase tracking-wider text-xs bg-[#059669] hover:bg-[#047857] text-white"
              onClick={handleQuickDemoLogin}
            >
              Đăng nhập nhanh (Tài khoản mẫu Khách Hàng)
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs font-bold"
              onClick={() => {
                setShowAuthModal(false);
                navigate(`/login?redirect=/marketplace/plot/${plotToBook?.id}/book`);
              }}
            >
              Chuyển đến trang Đăng nhập
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
