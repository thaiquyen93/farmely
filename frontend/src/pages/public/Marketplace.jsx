import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import MarketplaceFilterSidebar from '../../components/marketplace/MarketplaceFilterSidebar';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import { FARMS_GIS_DATA, MARKETPLACE_PLOTS_GIS, ALL_CROPS_FILTER_OPTIONS } from '../../data/marketplaceGisData';
import { SlidersHorizontal, X, LogIn, Search, MapPin, Sprout, RotateCcw, ChevronDown, MousePointerClick, Eye, FileSignature, ArrowRight } from 'lucide-react';

// ponytail: ceiling is client-side filter, upgrade path is backend API when Java ready
const BORDER = '1px solid rgba(255,255,255,0.06)';
const GLASS = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [priceMax, setPriceMax] = useState(10000000);
  const [facilities, setFacilities] = useState({ irrigation: false, iot: false, waterSource: false, organicSoil: false, techSupport: false });
  const [activeStatusTab, setActiveStatusTab] = useState('ALL');
  const [selectedPlotId, setSelectedPlotId] = useState('PLT-HV-01');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuide, setShowGuide] = useState(() => !sessionStorage.getItem('farmely_guide_dismissed'));

  useEffect(() => {
    if (searchParams.get('landId')) setSelectedLocation(searchParams.get('landId'));
    if (searchParams.get('crop')) setSelectedCrop(searchParams.get('crop'));
  }, [searchParams]);

  const toggleFacility = (key) => setFacilities((p) => ({ ...p, [key]: !p[key] }));

  const handleResetFilters = () => {
    setSearchQuery(''); setSelectedLocation('ALL'); setSelectedCrop('ALL');
    setAreaMin(''); setAreaMax(''); setPriceMax(10000000);
    setFacilities({ irrigation: false, iot: false, waterSource: false, organicSoil: false, techSupport: false });
    setActiveStatusTab('ALL');
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedLocation !== 'ALL' || selectedCrop !== 'ALL' || areaMin || areaMax || priceMax < 10000000 || Object.values(facilities).some(Boolean) || activeStatusTab !== 'ALL');

  const currentFarm = useMemo(() => (selectedLocation === 'ALL' ? FARMS_GIS_DATA[0] : FARMS_GIS_DATA.find((f) => f.id === selectedLocation) || FARMS_GIS_DATA[0]), [selectedLocation]);

  const filteredPlots = useMemo(() => MARKETPLACE_PLOTS_GIS.filter((p) => {
    if (activeStatusTab !== 'ALL' && p.status !== activeStatusTab) return false;
    if (selectedLocation !== 'ALL' && p.farmId !== selectedLocation) return false;
    if (selectedCrop !== 'ALL') { const m = p.crop.toLowerCase().includes(selectedCrop.toLowerCase()); const mc = p.compatibleCrops?.some((c) => c.name.toLowerCase().includes(selectedCrop.toLowerCase())); if (!m && !mc) return false; }
    if (areaMin && p.area < Number(areaMin)) return false;
    if (areaMax && p.area > Number(areaMax)) return false;
    if (priceMax && p.rentalPrice > priceMax) return false;
    if (facilities.irrigation && !p.facilities?.irrigation) return false;
    if (facilities.iot && !p.facilities?.iot) return false;
    if (facilities.waterSource && !p.facilities?.waterSource) return false;
    if (facilities.organicSoil && !p.facilities?.organicSoil) return false;
    if (facilities.techSupport && !p.facilities?.techSupport) return false;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); if (![p.code, p.name, p.farmName, p.crop].some((s) => s.toLowerCase().includes(q))) return false; }
    return true;
  }), [activeStatusTab, selectedLocation, selectedCrop, areaMin, areaMax, priceMax, facilities, searchQuery]);

  const statusCounts = useMemo(() => {
    const c = { ALL: MARKETPLACE_PLOTS_GIS.length, AVAILABLE: 0, RENTED: 0, MAINTENANCE: 0, UPCOMING: 0 };
    MARKETPLACE_PLOTS_GIS.forEach((p) => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, []);

  const selectedPlot = useMemo(() => filteredPlots.find((p) => p.id === selectedPlotId) || MARKETPLACE_PLOTS_GIS.find((p) => p.id === selectedPlotId) || filteredPlots[0] || null, [selectedPlotId, filteredPlots]);

  const handleSelectPlot = (plot) => { setSelectedPlotId(plot.id); if (window.innerWidth < 1024) setShowMobileDetail(true); };
  const handleBookPlot = (plot) => { if (!plot || plot.status !== 'AVAILABLE') return; if (!isAuthenticated) { setPlotToBook(plot); setShowAuthModal(true); } else navigate(`/marketplace/plot/${plot.id}/book`); };
  const handleQuickDemoLogin = () => { login(DEMO_ACCOUNTS.customer); setShowAuthModal(false); if (plotToBook) navigate(`/marketplace/plot/${plotToBook.id}/book`); };

  const STATUS_TABS = [
    { key: 'ALL', label: 'Tất cả', count: statusCounts.ALL, dot: '#8a8f98' },
    { key: 'AVAILABLE', label: 'Đang trống', count: statusCounts.AVAILABLE, dot: '#10B981' },
    { key: 'RENTED', label: 'Đã thuê', count: statusCounts.RENTED, dot: '#F59E0B' },
    { key: 'MAINTENANCE', label: 'Bảo trì', count: statusCounts.MAINTENANCE, dot: '#94A3B8' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#08090A', color: '#f7f8f8' }}>
      <PublicNavbar />

      {/* ── Hero / Onboarding Guide ── */}
      {showGuide && (
        <section className="pt-[72px] relative overflow-hidden" style={{ background: '#08090A' }}>
          {/* Ambient glow orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-1/4 w-[400px] h-[250px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,240,255,0.06) 0%, transparent 70%)' }} />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative">
            {/* Dismiss */}
            <button type="button" onClick={() => { setShowGuide(false); sessionStorage.setItem('farmely_guide_dismissed', '1'); }}
              className="absolute top-6 right-4 sm:right-6 lg:right-8 w-7 h-7 rounded-full flex items-center justify-center text-[#62666d] hover:text-[#f7f8f8] cursor-pointer transition-all hover:bg-white/5 z-10"
              title="Đóng hướng dẫn">
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Title area */}
            <div className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,240,255,0.1))', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Marketplace
              </div>
              <h1 className="text-[24px] sm:text-[30px] font-bold tracking-tight leading-[1.2] mb-3" style={{ letterSpacing: '-0.6px' }}>
                <span style={{ color: '#f7f8f8' }}>Chọn thửa đất, </span>
                <span style={{ background: 'linear-gradient(135deg, #10B981, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  bắt đầu canh tác
                </span>
              </h1>
              <p className="text-[13px] sm:text-[14px] leading-relaxed max-w-lg" style={{ color: '#9ca3af' }}>
                Khám phá bản đồ vệ tinh trang trại, chọn thửa đất phù hợp và ký hợp đồng thuê trực tuyến. Theo dõi toàn bộ quá trình canh tác theo thời gian thực.
              </p>
            </div>

            {/* 3-step guide cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
              {[
                { step: '01', icon: MousePointerClick, title: 'Chọn thửa đất', desc: 'Nhấp vào thửa đất trên bản đồ vệ tinh để xem vị trí thực tế', accent: '#10B981', accentBg: 'rgba(16,185,129,0.12)', accentBd: 'rgba(16,185,129,0.25)' },
                { step: '02', icon: Eye, title: 'Xem chi tiết & so sánh', desc: 'Diện tích, giá thuê, tiện ích tưới tiêu, IoT và cây trồng phù hợp', accent: '#00F0FF', accentBg: 'rgba(0,240,255,0.10)', accentBd: 'rgba(0,240,255,0.20)' },
                { step: '03', icon: FileSignature, title: 'Thuê ngay', desc: 'Ký hợp đồng, chọn hình thức canh tác và thanh toán trực tuyến', accent: '#8b8fff', accentBg: 'rgba(94,106,210,0.12)', accentBd: 'rgba(94,106,210,0.25)' },
              ].map((s, i) => (
                <div key={i} className="relative group rounded-xl px-4 py-4 transition-all duration-300 hover:translate-y-[-2px]"
                  style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${s.accentBd}`, backdropFilter: 'blur(8px)' }}>
                  {/* Top glow line */}
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}40, transparent)` }} />

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: s.accentBg, border: `1px solid ${s.accentBd}`, boxShadow: `0 0 20px ${s.accent}15` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono font-bold tracking-[0.2em] px-1.5 py-0.5 rounded"
                          style={{ color: s.accent, background: `${s.accent}10` }}>
                          {s.step}
                        </span>
                        {i < 2 && <ArrowRight className="w-3 h-3 hidden sm:block" style={{ color: `${s.accent}50` }} />}
                      </div>
                      <p className="text-[13px] font-semibold text-[#e5e7eb] leading-snug mb-0.5">{s.title}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280' }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom stats strip */}
            <div className="flex items-center gap-5 mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {[
                { val: '16', label: 'Thửa đất', color: '#10B981' },
                { val: '150m²', label: 'Diện tích TB', color: '#00F0FF' },
                { val: '24/7', label: 'Giám sát IoT', color: '#8b8fff' },
              ].map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[16px] sm:text-[18px] font-bold" style={{ color: st.color }}>{st.val}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: '#6b7280' }}>{st.label}</span>
                  {i < 2 && <div className="w-px h-4 ml-3" style={{ background: 'rgba(255,255,255,0.06)' }} />}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Command Bar ── */}
      <header className={`${showGuide ? '' : 'pt-[72px]'} sticky top-0 z-30`} style={{ background: 'rgba(15,16,17,0.85)', backdropFilter: 'blur(12px)', borderBottom: BORDER }}>
        <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">

          {/* Left: location + search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                className="appearance-none pl-7 pr-7 py-1.5 rounded-md text-[12px] font-medium text-[#d0d6e0] focus:outline-none cursor-pointer"
                style={{ ...GLASS, background: 'rgba(255,255,255,0.03)' }}>
                <option value="ALL">Tất cả trang trại</option>
                {FARMS_GIS_DATA.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.province})</option>)}
              </select>
              <MapPin className="w-3 h-3 text-[#62666d] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-[#62666d] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#62666d]" />
              <input type="text" placeholder="Tìm mã thửa, cây trồng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 rounded-md text-[12px] font-medium text-[#f7f8f8] placeholder-[#4d4d4d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50"
                style={GLASS} />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#f7f8f8] cursor-pointer"><X className="w-3 h-3" /></button>
              )}
            </div>
          </div>

          {/* Center: status pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map((t) => {
              const on = activeStatusTab === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setActiveStatusTab(t.key)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all"
                  style={{
                    background: on ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: on ? '#f7f8f8' : '#8a8f98',
                    border: on ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? '#f7f8f8' : t.dot }} />
                  {t.label}
                  <span className="text-[10px] ml-0.5" style={{ color: on ? '#d0d6e0' : '#62666d' }}>{t.count}</span>
                </button>
              );
            })}
          </div>

          {/* Right: filter + reset */}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setShowFilterDrawer(true)}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-all"
              style={{
                ...GLASS,
                color: hasActiveFilters ? '#7170ff' : '#8a8f98',
                borderColor: hasActiveFilters ? 'rgba(113,112,255,0.3)' : 'rgba(255,255,255,0.08)',
              }}>
              <SlidersHorizontal className="w-3 h-3" />Bộ lọc
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#7170ff]" />}
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-[#f7f8f8] cursor-pointer transition-colors" style={GLASS} title="Reset">
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main: Map + Detail ── */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 min-w-0">
        {/* Mobile bar */}
        <div className="flex lg:hidden items-center justify-between gap-3 mb-2.5 px-3 py-2 rounded-lg" style={GLASS}>
          <span className="text-[11px] text-[#8a8f98] font-medium">16 Thửa đất</span>
          {selectedPlot && (
            <button type="button" onClick={() => setShowMobileDetail(true)}
              className="py-1 px-3 rounded-md text-[11px] font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              style={{ background: '#5e6ad2' }}>
              <Sprout className="w-3 h-3" />Xem {selectedPlot.code}
            </button>
          )}
        </div>

        {/* 2-col split */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch h-auto lg:h-[calc(100vh-140px)] lg:min-h-[680px]">
          <div className="flex-1 w-full min-w-0 h-[560px] sm:h-[620px] lg:h-full">
            <MarketplaceInteractiveMap
              plots={filteredPlots}
              selectedPlot={selectedPlot}
              onSelectPlot={handleSelectPlot}
              currentFarm={currentFarm}
              activeStatusTab={activeStatusTab}
            />
          </div>
          <div className="hidden lg:block w-[360px] xl:w-[380px] shrink-0 h-full">
            <MarketplacePlotDetailPanel plot={selectedPlot} onBookPlot={handleBookPlot} onFocusOnMap={() => {}} />
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Drawers & Modals ── */}

      {/* Filter drawer */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md bg-white text-brand-dark h-full overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="font-heading font-black text-lg text-brand-dark flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-green" />Bộ Lọc Nâng Cao
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Lọc thửa đất theo diện tích, giá thuê, tiện ích VietGAP</p>
              </div>
              <button type="button" onClick={() => setShowFilterDrawer(false)} className="p-1.5 rounded-xl text-stone-400 hover:text-brand-dark hover:bg-stone-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <MarketplaceFilterSidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} selectedCrop={selectedCrop} setSelectedCrop={setSelectedCrop} areaMin={areaMin} setAreaMin={setAreaMin} areaMax={areaMax} setAreaMax={setAreaMax} priceMax={priceMax} setPriceMax={setPriceMax} facilities={facilities} toggleFacility={toggleFacility} availableCrops={ALL_CROPS_FILTER_OPTIONS} locations={FARMS_GIS_DATA} onResetFilters={handleResetFilters} hasActiveFilters={hasActiveFilters} />
            <div className="pt-3 border-t border-brand-border flex items-center gap-3">
              <Button variant="outline" className="flex-1 text-xs font-bold" onClick={handleResetFilters}>Xóa tất cả</Button>
              <Button variant="primary" className="flex-1 text-xs font-bold uppercase tracking-wider" onClick={() => setShowFilterDrawer(false)}>Áp dụng ({filteredPlots.length} thửa)</Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile detail sheet */}
      {showMobileDetail && selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-h-[88vh] rounded-t-2xl overflow-y-auto p-4 shadow-2xl" style={{ background: '#0f1011', borderTop: BORDER }}>
            <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: BORDER }}>
              <span className="text-[14px] font-semibold text-[#f7f8f8]">{selectedPlot.code}</span>
              <button type="button" onClick={() => setShowMobileDetail(false)} className="p-1 rounded text-[#62666d] hover:text-[#f7f8f8] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <MarketplacePlotDetailPanel plot={selectedPlot} onBookPlot={(p) => { setShowMobileDetail(false); handleBookPlot(p); }} onFocusOnMap={() => setShowMobileDetail(false)} />
          </div>
        </div>
      )}

      {/* Auth modal */}
      <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} title="Yêu Cầu Đăng Nhập" subtitle={plotToBook ? `${plotToBook.code} • ${plotToBook.name}` : undefined}>
        <div className="space-y-4 text-center py-2 text-brand-dark">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto"><LogIn className="w-7 h-7" /></div>
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-base text-brand-dark">Đăng nhập tài khoản Farmely</h4>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">Bạn cần đăng nhập để tiến hành ký hợp đồng thuê thửa đất và thanh toán VietQR.</p>
          </div>
          {plotToBook && (
            <div className="p-3 bg-brand-cream rounded-xl text-left text-xs border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {plotToBook.code} ({plotToBook.farmName})</p>
              <p><strong>Diện tích:</strong> {plotToBook.areaFormatted}</p>
              <p><strong>Giá thuê:</strong> {plotToBook.rentalPriceFormatted}</p>
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Button variant="primary" className="w-full font-bold uppercase tracking-wider text-xs" onClick={handleQuickDemoLogin}>Đăng nhập nhanh (Tài khoản mẫu)</Button>
            <Button variant="outline" className="w-full text-xs font-bold" onClick={() => { setShowAuthModal(false); navigate(`/login?redirect=/marketplace/plot/${plotToBook?.id}/book`); }}>Chuyển đến trang Đăng nhập</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
