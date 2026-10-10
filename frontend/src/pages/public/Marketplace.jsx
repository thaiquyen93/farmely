import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';

// Marketplace GIS Components
import MarketplaceFilterSidebar from '../../components/marketplace/MarketplaceFilterSidebar';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';

// GIS Data
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
  ChevronDown
} from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuthStore();

  // Filters State
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

  // Status Tab Filter ('ALL' | 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UPCOMING')
  const [activeStatusTab, setActiveStatusTab] = useState('ALL');

  // Selected Plot for GIS Map & Detail Panel (defaults to Plot P-01 matching reference screenshot)
  const [selectedPlotId, setSelectedPlotId] = useState('PLT-HV-01');

  // Filter Drawer & Mobile Drawers
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Auth / Booking Confirmation Modal
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync with URL params if provided
  useEffect(() => {
    if (searchParams.get('landId')) {
      setSelectedLocation(searchParams.get('landId'));
    }
    if (searchParams.get('crop')) {
      setSelectedCrop(searchParams.get('crop'));
    }
  }, [searchParams]);

  const toggleFacility = (key) => {
    setFacilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // Currently selected farm
  const currentFarm = useMemo(() => {
    if (selectedLocation === 'ALL') {
      return FARMS_GIS_DATA[0];
    }
    return FARMS_GIS_DATA.find((f) => f.id === selectedLocation) || FARMS_GIS_DATA[0];
  }, [selectedLocation]);

  // Filtered plots
  const filteredPlots = useMemo(() => {
    return MARKETPLACE_PLOTS_GIS.filter((plot) => {
      // 1. Status tab
      if (activeStatusTab !== 'ALL' && plot.status !== activeStatusTab) {
        return false;
      }

      // 2. Location
      if (selectedLocation !== 'ALL' && plot.farmId !== selectedLocation) {
        return false;
      }

      // 3. Crop
      if (selectedCrop !== 'ALL') {
        const matchesMainCrop = plot.crop.toLowerCase().includes(selectedCrop.toLowerCase());
        const matchesCompatible = plot.compatibleCrops?.some((c) =>
          c.name.toLowerCase().includes(selectedCrop.toLowerCase())
        );
        if (!matchesMainCrop && !matchesCompatible) return false;
      }

      // 4. Area
      if (areaMin && plot.area < Number(areaMin)) return false;
      if (areaMax && plot.area > Number(areaMax)) return false;

      // 5. Price
      if (priceMax && plot.rentalPrice > priceMax) return false;

      // 6. Facilities
      if (facilities.irrigation && !plot.facilities?.irrigation) return false;
      if (facilities.iot && !plot.facilities?.iot) return false;
      if (facilities.waterSource && !plot.facilities?.waterSource) return false;
      if (facilities.organicSoil && !plot.facilities?.organicSoil) return false;
      if (facilities.techSupport && !plot.facilities?.techSupport) return false;

      // 7. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = plot.code.toLowerCase().includes(q);
        const matchesName = plot.name.toLowerCase().includes(q);
        const matchesFarm = plot.farmName.toLowerCase().includes(q);
        const matchesCrop = plot.crop.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesFarm && !matchesCrop) return false;
      }

      return true;
    });
  }, [
    activeStatusTab,
    selectedLocation,
    selectedCrop,
    areaMin,
    areaMax,
    priceMax,
    facilities,
    searchQuery
  ]);

  // Status counts for status pills
  const statusCounts = useMemo(() => {
    const counts = { ALL: MARKETPLACE_PLOTS_GIS.length, AVAILABLE: 0, RENTED: 0, MAINTENANCE: 0, UPCOMING: 0 };
    MARKETPLACE_PLOTS_GIS.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, []);

  // Currently selected plot object
  const selectedPlot = useMemo(() => {
    return (
      filteredPlots.find((p) => p.id === selectedPlotId) ||
      MARKETPLACE_PLOTS_GIS.find((p) => p.id === selectedPlotId) ||
      filteredPlots[0] ||
      null
    );
  }, [selectedPlotId, filteredPlots]);

  // Handle plot selection from map
  const handleSelectPlot = (plot) => {
    setSelectedPlotId(plot.id);
    if (window.innerWidth < 1024) {
      setShowMobileDetail(true);
    }
  };

  // Handle booking action
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
    if (plotToBook) {
      navigate(`/marketplace/plot/${plotToBook.id}/book`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Global Navbar preserved */}
      <PublicNavbar />

      {/* 2. Top Interactive Command Bar / Filter Rail */}
      <header className="pt-24 pb-3 px-4 sm:px-6 lg:px-8 border-b border-stone-800/80 bg-[#0B111E]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Farm Location & Search */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Location Selector */}
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="appearance-none bg-[#131C2E] border border-stone-700/80 hover:border-emerald-500/60 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer shadow-sm"
              >
                <option value="ALL">Tất cả trang trại</option>
                {FARMS_GIS_DATA.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.province})
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã thửa, cây trồng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#131C2E] rounded-xl border border-stone-700/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-stone-500 transition-all font-medium shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Center: Status Tabs Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {[
              { key: 'ALL', label: 'Tất cả', count: statusCounts.ALL, dot: 'bg-cyan-400' },
              { key: 'AVAILABLE', label: 'Đang trống', count: statusCounts.AVAILABLE, dot: 'bg-emerald-400' },
              { key: 'RENTED', label: 'Đã thuê', count: statusCounts.RENTED, dot: 'bg-amber-400' },
              { key: 'MAINTENANCE', label: 'Bảo trì', count: statusCounts.MAINTENANCE, dot: 'bg-slate-400' }
            ].map((tab) => {
              const isActive = activeStatusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveStatusTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-300'
                      : 'bg-[#131C2E] text-stone-300 hover:text-white border border-stone-700/80 hover:bg-stone-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-black' : tab.dot}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Advanced Filter Trigger & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                hasActiveFilters
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-[#131C2E] border-stone-700/80 text-stone-300 hover:text-white hover:border-stone-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bộ lọc nâng cao</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700 transition-all cursor-pointer"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 3. Main Workspace: Full-Width Immersive GIS Command Center */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-w-0">
        
        {/* Mobile quick action bar */}
        <div className="flex lg:hidden items-center justify-between gap-3 mb-3 bg-[#0B111E] p-2.5 rounded-2xl border border-stone-800">
          <span className="text-xs text-stone-400 pl-1 font-medium">
            16 Thửa đất trắc địa
          </span>
          {selectedPlot && (
            <button
              type="button"
              onClick={() => setShowMobileDetail(true)}
              className="py-1.5 px-3.5 rounded-xl bg-cyan-500 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Xem {selectedPlot.code}</span>
            </button>
          )}
        </div>

        {/* 2-Column Split: Massive GIS Satellite Map + Right Detail Panel */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch h-auto lg:h-[calc(100vh-175px)] lg:min-h-[680px]">
          
          {/* COLUMN 1 (MASSIVE CENTER/LEFT): Ultra-HD Orthophoto GIS Map */}
          <div className="flex-1 w-full min-w-0 h-[560px] sm:h-[620px] lg:h-full rounded-3xl overflow-hidden shadow-2xl relative">
            <MarketplaceInteractiveMap
              plots={filteredPlots}
              selectedPlot={selectedPlot}
              onSelectPlot={handleSelectPlot}
              currentFarm={currentFarm}
              onSelectFarm={(farmId) => setSelectedLocation(farmId)}
              activeStatusTab={activeStatusTab}
            />
          </div>

          {/* COLUMN 2 (RIGHT): Pinned Interactive Detail Panel */}
          <div className="hidden lg:block w-[380px] xl:w-[420px] shrink-0 h-full overflow-y-auto rounded-3xl shadow-2xl scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
            <MarketplacePlotDetailPanel
              plot={selectedPlot}
              onBookPlot={handleBookPlot}
              onFocusOnMap={() => {
                // Focus event
              }}
            />
          </div>

        </div>

      </main>

      {/* 4. Global Footer preserved */}
      <Footer />

      {/* ================= MODALS & SLIDE-OVER DRAWERS ================= */}

      {/* Advanced Filter Slide-over Drawer */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white text-brand-dark h-full overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="font-heading font-black text-lg text-brand-dark flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-green" />
                  <span>Bộ Lọc Nâng Cao</span>
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Lọc thửa đất theo tiêu chuẩn diện tích, giá thuê, tiện ích VietGAP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-brand-dark hover:bg-stone-100 transition-all cursor-pointer"
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

            <div className="pt-3 border-t border-brand-border flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={handleResetFilters}
              >
                Xóa tất cả
              </Button>
              <Button
                variant="primary"
                className="flex-1 text-xs font-bold uppercase tracking-wider"
                onClick={() => setShowFilterDrawer(false)}
              >
                Áp dụng ({filteredPlots.length} thửa)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Plot Detail Bottom Sheet */}
      {showMobileDetail && selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="w-full max-h-[88vh] bg-white text-brand-dark rounded-t-3xl overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="font-heading font-black text-base text-brand-dark">
                Chi Tiết {selectedPlot.code}
              </span>
              <button
                type="button"
                onClick={() => setShowMobileDetail(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MarketplacePlotDetailPanel
              plot={selectedPlot}
              onBookPlot={(plot) => {
                setShowMobileDetail(false);
                handleBookPlot(plot);
              }}
              onFocusOnMap={() => {
                setShowMobileDetail(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Authentication Prompt Modal for Rental Booking */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Yêu Cầu Đăng Nhập Để Thuê Thửa Đất"
        subtitle={plotToBook ? `${plotToBook.code} • ${plotToBook.name}` : undefined}
      >
        <div className="space-y-4 text-center py-2 text-brand-dark">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="font-heading font-bold text-base text-brand-dark">
              Đăng nhập tài khoản Farmely
            </h4>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
              Bạn cần đăng nhập tài khoản khách hàng để tiến hành ký hợp đồng thuê thửa đất, chọn hình thức chăm sóc (Assisted/Self) và thanh toán VietQR.
            </p>
          </div>

          {plotToBook && (
            <div className="p-3 bg-brand-cream rounded-xl text-left text-xs border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {plotToBook.code} ({plotToBook.farmName})</p>
              <p><strong>Diện tích:</strong> {plotToBook.areaFormatted}</p>
              <p><strong>Giá thuê:</strong> {plotToBook.rentalPriceFormatted}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              className="w-full font-bold uppercase tracking-wider text-xs"
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
