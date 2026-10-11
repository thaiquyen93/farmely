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
import MarketplacePlotCards from '../../components/marketplace/MarketplacePlotCards';
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
  AlertCircle,
  Sprout
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

  // Mobile Drawers
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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

  // Current active farm
  const currentFarm = useMemo(() => {
    if (selectedLocation === 'ALL') {
      return FARMS_GIS_DATA[0]; // Happy Valley default
    }
    return FARMS_GIS_DATA.find((f) => f.id === selectedLocation) || FARMS_GIS_DATA[0];
  }, [selectedLocation]);

  // Toggle facility filter checkbox
  const toggleFacility = (facilityKey) => {
    setFacilities((prev) => ({
      ...prev,
      [facilityKey]: !prev[facilityKey]
    }));
  };

  // Reset all filters
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
    searchQuery ||
    selectedLocation !== 'ALL' ||
    selectedCrop !== 'ALL' ||
    areaMin ||
    areaMax ||
    priceMax < 10000000 ||
    Object.values(facilities).some(Boolean) ||
    activeStatusTab !== 'ALL'
  );

  // Filter plots based on all criteria
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

  // Compute status counts for the tabs bar
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

  // Handle plot selection from map or card
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
      // Navigate to existing Farmely booking page
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
    <div className="min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      {/* 1. Global Navbar preserved */}
      <PublicNavbar />

      {/* 2. Main Marketplace Container */}
      <main className="box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        
        {/* Mobile Filter & Detail Trigger Bar */}
        <div className="flex lg:hidden items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-brand-border shadow-sm min-w-0">
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="flex-1 min-w-0 min-h-11 py-2 px-2 rounded-xl bg-brand-cream border border-brand-border text-xs font-bold text-brand-dark flex items-center justify-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-green" />
            <span className="truncate">Bộ lọc {hasActiveFilters && '• Đang lọc'}</span>
          </button>

          {selectedPlot && (
            <button
              type="button"
              onClick={() => setShowMobileDetail(true)}
              className="flex-1 min-w-0 min-h-11 py-2 px-2 rounded-xl bg-[#294C38] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5 text-brand-yellow" />
              <span className="truncate">Xem {selectedPlot.code}</span>
            </button>
          )}
        </div>

        {/* 3. Plot-first layout: selector in the center, details on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">

          {/* MAIN CENTER CONTENT */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
            <div className="hidden lg:block">
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
              compact
            />
            </div>

            {/* Top: Interactive GIS Map */}
            <MarketplaceInteractiveMap
              plots={filteredPlots}
              selectedPlot={selectedPlot}
              onSelectPlot={handleSelectPlot}
              currentFarm={currentFarm}
              onSelectFarm={(farmId) => setSelectedLocation(farmId)}
            />

            {/* Bottom: Plot Status Tabs and Cards Grid */}
            <MarketplacePlotCards
              plots={filteredPlots}
              selectedPlot={selectedPlot}
              onSelectPlot={handleSelectPlot}
              onBookPlot={handleBookPlot}
              activeStatusTab={activeStatusTab}
              setActiveStatusTab={setActiveStatusTab}
              statusCounts={statusCounts}
            />
          </div>

          {/* PLOT DETAIL PANEL (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-28">
            <MarketplacePlotDetailPanel
              plot={selectedPlot}
              onBookPlot={handleBookPlot}
              onFocusOnMap={() => {
                // Scrolls smoothly to map if scrolled past
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
            />
          </div>

        </div>

      </main>

      {/* 4. Global Footer preserved */}
      <Footer />

      {/* ================= MODALS & MOBILE DRAWERS ================= */}

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="font-heading font-black text-base text-brand-dark">Bộ Lọc Canh Tác</h3>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-brand-dark"
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

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowMobileFilters(false)}
              >
                Áp dụng bộ lọc ({filteredPlots.length} thửa)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Plot Detail Bottom Sheet */}
      {showMobileDetail && selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="w-full max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="font-heading font-black text-sm text-brand-dark">
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
                window.scrollTo({ top: 120, behavior: 'smooth' });
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
        <div className="space-y-4 text-center py-2">
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
