import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import { FARMS_GEOJSON_DATA } from '../../data/marketplaceGisData';
import { LogIn, Search, X, ChevronRight, ChevronLeft, Sparkles, ArrowRight } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlotId, setSelectedPlotId] = useState('P-01');
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPlotListCollapsed, setIsPlotListCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1365px)').matches
  );
  const [selectedCropByPlot, setSelectedCropByPlot] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('farmely_selected_crop_by_plot', JSON.stringify(selectedCropByPlot));
  }, [selectedCropByPlot]);

  // Tải dữ liệu thửa đất qua API gateway.
  const [dbPlots, setDbPlots] = useState([]);
  const [dbSource, setDbSource] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadPlotsFromDb() {
      try {
        const res = await fetch('/api/plots/marketplace');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.data || []);
          if (list && list.length > 0 && active) {
            setDbPlots(list);
            setDbSource('Farmely PostgreSQL');
          }
        }
      } catch (err) {
        console.warn('[Marketplace] Fetch /api/plots/marketplace fallback to GIS data:', err);
      }
    }
    loadPlotsFromDb();
    return () => { active = false; };
  }, []);

  // Hợp nhất hình học bản đồ với dữ liệu nghiệp vụ từ backend.
  const livePlotsGeoJson = useMemo(() => {
    if (!dbPlots || dbPlots.length === 0) return FARMS_GEOJSON_DATA;

    const dbMap = new Map();
    dbPlots.forEach((dp) => {
      const codeKey = (dp.plot_code || dp.plotCode || dp.code || '').toUpperCase().replace('PLOT ', '').trim();
      dbMap.set(codeKey, dp);
    });

    const updatedFeatures = FARMS_GEOJSON_DATA.features.map((feat) => {
      const p = feat.properties;
      const featKey = (p.id || p.code || '').toUpperCase().replace('PLOT ', '').trim();
      const match = dbMap.get(featKey);
      if (!match) return feat;

      const liveStatus = match.status === 'AVAIL'
        ? 'Đang trống'
        : (match.status === 'RENT'
            ? 'Đã thuê'
            : (match.status === 'MAINT' ? 'Bảo trì' : match.status_text || p.status));

      return {
        ...feat,
        properties: {
          ...p,
          plot_id: match.plot_id || match.plotId || p.plot_id,
          status: liveStatus,
          statusCode: match.status,
          price: match.price_text || p.price,
          rentalPrice: (match.price_per_period || match.pricePerPeriod) ? Number(match.price_per_period || match.pricePerPeriod) : p.rentalPrice,
          area: match.area_text || p.area,
          sizeNumber: match.area ? Number(match.area) : p.sizeNumber,
          compatibleCrops: match.compatible_crops?.length
            ? match.compatible_crops
            : (match.compatibleVarieties?.length
                ? match.compatibleVarieties.map((item) => item.cropName || item.varietyName)
                : p.compatibleCrops),
          dbSynced: true
        }
      };
    });

    return {
      ...FARMS_GEOJSON_DATA,
      features: updatedFeatures
    };
  }, [dbPlots]);

  // Danh sách các thửa đất từ GeoJSON đã được đồng bộ với DB
  const allPlots = useMemo(() => {
    return livePlotsGeoJson.features.map((f) => f.properties);
  }, [livePlotsGeoJson]);

  // Danh sách chọn nhiều thửa đất trực tiếp trên Marketplace (bảo toàn qua localStorage & URL)
  const [contractSelectedPlots, setContractSelectedPlots] = useState(() => {
    try {
      const saved = localStorage.getItem('farmely_master_lease_selected_plots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Tự động khôi phục danh sách thửa đất khi URL thay đổi hoặc quay lại trang
  useEffect(() => {
    const plotsQuery = searchParams.get('plots');
    if (plotsQuery) {
      const codes = plotsQuery.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
      const matched = allPlots.filter((p) => {
        const idLower = (p.id || '').toLowerCase();
        const codeLower = (p.code || '').toLowerCase();
        const labelLower = (p.label || '').toLowerCase();
        return codes.some(
          (c) =>
            idLower === c ||
            codeLower === c ||
            labelLower === c ||
            codeLower.replace('plot ', '').trim() === c ||
            c.replace('plot ', '').trim() === codeLower ||
            idLower.includes(c) ||
            c.includes(idLower)
        );
      });
      if (matched.length > 0) {
        setContractSelectedPlots(matched);
        return;
      }
    }

    // Nếu không có trên URL thì đọc từ localStorage
    try {
      const saved = localStorage.getItem('farmely_master_lease_selected_plots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = parsed
            .map((sp) => allPlots.find((p) => (p.id || p.code) === (sp.id || sp.code)) || sp)
            .filter(Boolean);
          if (matched.length > 0) {
            setContractSelectedPlots(matched);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [location.search, location.key, allPlots]);

  // Tự động lưu vào localStorage mỗi khi danh sách thửa đất thay đổi
  useEffect(() => {
    try {
      if (contractSelectedPlots.length > 0) {
        localStorage.setItem(
          'farmely_master_lease_selected_plots',
          JSON.stringify(contractSelectedPlots)
        );
      } else {
        localStorage.removeItem('farmely_master_lease_selected_plots');
      }
    } catch (e) {
      console.error(e);
    }
  }, [contractSelectedPlots]);

  // Lọc theo search input & bộ lọc trạng thái
  const filteredPlots = useMemo(() => {
    let result = allPlots;
    if (statusFilter === 'AVAILABLE') {
      result = result.filter((p) => p.status === 'Đang trống' || p.status === 'AVAILABLE' || p.statusCode === 'AVAIL');
    } else if (statusFilter === 'RENTED') {
      result = result.filter((p) => p.status === 'Đã thuê' || p.status === 'RENTED' || p.statusCode === 'RENT');
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (p) =>
        p.id?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.crops?.some((c) => c.toLowerCase().includes(q))
    );
  }, [allPlots, searchQuery, statusFilter]);

  // Thửa đất đang được chọn
  const selectedPlot = useMemo(() => {
    return (
      allPlots.find((p) => p.id === selectedPlotId || p.code === selectedPlotId) ||
      allPlots[0]
    );
  }, [allPlots, selectedPlotId]);

  // Thống kê số thửa sẵn có
  const availableCount = useMemo(() => {
    return allPlots.filter((p) => p.status === 'Đang trống' || p.status === 'AVAILABLE' || p.statusCode === 'AVAIL').length;
  }, [allPlots]);

  // Chọn thửa đất
  const handleSelectPlot = (plot) => {
    const id = plot.id || plot.code;
    setSelectedPlotId(id);
    setShowDetailPanel(true);
    // Cuộn mượt mà đến item tương ứng trong danh sách bên trái
    setTimeout(() => {
      const el = document.getElementById(`plot-card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Đóng panel chi tiết
  const handleCloseDetail = () => {
    setShowDetailPanel(false);
  };

  // Chọn / bỏ chọn thửa đất
  const handleToggleSelectPlotForContract = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
    if (!isVacant) return;

    setContractSelectedPlots((prev) => {
      const exists = prev.some((p) => (p.id || p.code) === (plot.id || plot.code));
      if (exists) {
        return prev.filter((p) => (p.id || p.code) !== (plot.id || plot.code));
      } else {
        return [...prev, plot];
      }
    });
  };

  const isPlotSelectedForContract = (plot) => {
    if (!plot) return false;
    return contractSelectedPlots.some((p) => (p.id || p.code) === (plot.id || plot.code));
  };

  // Tổng diện tích các thửa đất đã chọn
  const totalSelectedArea = useMemo(() => {
    return contractSelectedPlots.reduce((sum, p) => {
      const raw = p.areaFormatted || p.area || 0;
      const num = typeof raw === 'number' ? raw : parseInt(raw, 10) || 50;
      return sum + num;
    }, 0);
  }, [contractSelectedPlots]);

  // Tổng tiền thuê hàng tháng
  const totalSelectedPrice = useMemo(() => {
    return contractSelectedPlots.reduce((sum, p) => {
      const price = p.rentalPrice || (typeof p.price === 'number' ? p.price : 1200000);
      return sum + price;
    }, 0);
  }, [contractSelectedPlots]);

  // Tiến hành thuê thửa đất (từ nút "Thuê ngay thửa này" hoặc Floating Bar)
  const handleBookPlot = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
    if (!isVacant) return;

    // Nếu đã có các thửa đất khác được chọn thì gộp tất cả vào hợp đồng
    const allSelected = isPlotSelectedForContract(plot)
      ? contractSelectedPlots
      : contractSelectedPlots.length > 0
      ? [...contractSelectedPlots, plot]
      : [plot];

    const firstPlot = allSelected[0];
    const plotCodes = allSelected.map((p) => p.code || p.id).join(',');

    if (!isAuthenticated) {
      setPlotToBook(firstPlot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${firstPlot.id || firstPlot.code}/book?plots=${plotCodes}`);
    }
  };

  // Tiến hành thuê từ thanh danh sách đã chọn
  const handleProceedToMultiPlotLease = () => {
    if (contractSelectedPlots.length === 0) return;
    const firstPlot = contractSelectedPlots[0];
    const plotCodes = contractSelectedPlots.map((p) => p.code || p.id).join(',');

    if (!isAuthenticated) {
      setPlotToBook(firstPlot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${firstPlot.id || firstPlot.code}/book?plots=${plotCodes}`);
    }
  };

  const handleQuickDemoLogin = () => {
    setShowAuthModal(false);
    navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. BẢN ĐỒ VỆ TINH TRÀN TOÀN BỘ MÀN HÌNH (MapLibre GL JS + ESRI Satellite)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div id="map" className="absolute inset-0 z-0 w-full h-full">
        <MarketplaceInteractiveMap
          plotsData={livePlotsGeoJson}
          selectedPlot={selectedPlot}
          onSelectPlot={handleSelectPlot}
          onResetView={handleCloseDetail}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. THANH ĐIỀU HƯỚNG CAPSULE LƠ LỬNG (FLOATING ISLAND CAPSULE NAVBAR)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="absolute left-2 right-2 top-3 z-30 mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/95 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto sm:left-4 sm:right-4 sm:rounded-full sm:px-4">
        {/* Logo Farmely tinh tế */}
        <Link to="/" className="flex items-center gap-2 group pr-1 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-sm shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
            🌱
          </div>
          <div className="hidden xl:block">
            <span className="text-sm font-black tracking-tight text-slate-800 block leading-tight">
              FARMELY
            </span>
            <span className="block text-[8px] font-bold text-emerald-600 uppercase tracking-widest -mt-0.5">
              Smart Agri
            </span>
          </div>
        </Link>

        {/* Badge dữ liệu backend */}
        {dbSource && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 rounded-full shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live DB: {dbPlots.length} Plots</span>
          </div>
        )}

        {/* Phân cách mờ */}
        <div className="h-4 w-[1px] bg-slate-200/80 shrink-0" />

        {/* Menu liên kết phong cách Pill */}
        <nav className="hidden min-w-0 items-center gap-1 text-xs font-semibold text-slate-600 sm:flex">
          <Link
            to="/"
            className="whitespace-nowrap px-2.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            Trang chủ
          </Link>
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 shadow-2xs transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Marketplace
          </Link>
          <Link
            to="/site-visit/book"
            className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 transition-all hover:bg-slate-100/70 hover:text-slate-900 lg:block"
          >
            Đặt lịch tham quan
          </Link>
          <Link
            to="/about"
            className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 transition-all hover:bg-slate-100/70 hover:text-slate-900 lg:block"
          >
            Về Farmely
          </Link>
        </nav>

        {/* Phân cách mờ */}
        <div className="hidden h-4 w-px shrink-0 bg-slate-200/80 sm:block" />

        {/* Nút Đăng nhập / Tài khoản */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/login"
              className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100/70 hover:text-slate-900"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95"
            >
              Đăng ký
            </Link>
          </div>
        ) : (
          <Link
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs transition-all hover:bg-emerald-100/80 active:scale-95"
          >
            <span className="text-sm">🌿</span>
            <span>{user?.name ? user.name.split(' ')[0] : 'Vườn của tôi'}</span>
          </Link>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BẢNG TIỆN ÍCH & DANH SÁCH BÊN TRÁI (LEFT ASIDE PANEL)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isPlotListCollapsed && (
        <button
          type="button"
          onClick={() => setIsPlotListCollapsed(false)}
          className="absolute left-3 top-24 z-30 flex h-12 items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 text-xs font-black text-emerald-800 shadow-xl backdrop-blur-xl"
          title="Mở danh sách thửa đất"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden 2xl:inline">{filteredPlots.length} thửa</span>
        </button>
      )}
      <aside className={`absolute top-20 left-2 sm:left-3 2xl:left-6 z-20 w-[min(92vw,340px)] 2xl:w-[360px] flex flex-col gap-3 pointer-events-auto transition-transform duration-300 ${isPlotListCollapsed ? '-translate-x-[120%]' : 'translate-x-0'}`}>
        {/* Danh sách các thửa đất với hiệu ứng cao cấp */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/80 transition-all duration-300">
          {/* Header với icon & số lượng */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 tracking-tight uppercase block leading-none">
                  Thửa đất nổi bật
                </span>
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tiêu chuẩn VietGAP
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full shadow-2xs">
              {filteredPlots.length} thửa
            </span>
            <button
              type="button"
              onClick={() => setIsPlotListCollapsed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
              title="Thu gọn danh sách"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Quick filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl mb-2.5 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({allPlots.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'AVAILABLE' ? 'bg-white' : 'bg-emerald-500'}`} />
              Đang trống ({allPlots.filter(p => p.status === 'Đang trống' || p.status === 'AVAILABLE').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RENTED')}
              className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'RENTED'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã thuê
            </button>
          </div>

          {/* Danh sách thẻ thửa đất mượt mà */}
          <div className="space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar pr-0.5">
            {filteredPlots.map((p) => {
              const isVacant = p.status === 'Đang trống' || p.status === 'AVAILABLE';
              const isSelected = selectedPlot?.id === p.id;
              const displayPrice = p.price || (p.rentalPrice ? `${p.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
              return (
                <div
                  id={`plot-card-${p.id}`}
                  key={p.id}
                  onClick={() => handleSelectPlot(p)}
                  className={`group relative rounded-2xl border p-3 transition-all duration-300 ease-out cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white/95 shadow-[0_6px_20px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400/30 scale-[1.01]'
                      : 'border-slate-100/90 bg-white/90 hover:border-emerald-300/80 hover:bg-emerald-50/30 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.008]'
                  }`}
                >
                  {/* Thanh chỉ báo phát sáng góc trái khi đang chọn */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/50" />
                  )}

                  <div className="flex min-w-0 items-center justify-between gap-2 pl-1">
                    <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125 ${
                          isVacant
                            ? 'bg-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className={`whitespace-nowrap font-black text-xs tracking-tight transition-colors ${
                        isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                      }`}>
                        {p.id}
                      </span>
                      <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded-md">
                        {p.area}
                      </span>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs transition-all duration-300 ${
                        isVacant
                          ? isSelected
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300/60 shadow-xs'
                            : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 group-hover:bg-emerald-200/80'
                          : 'bg-slate-100 text-slate-500 border border-slate-200/70'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVacant
                            ? isSelected
                              ? 'bg-white'
                              : 'bg-emerald-500 animate-pulse'
                            : 'bg-slate-400'
                        }`}
                      />
                      {isVacant ? 'Trống' : 'Đã thuê'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 pl-1">
                    <span className="whitespace-nowrap text-[11px] font-black tracking-tight text-emerald-700">
                      {displayPrice}<span className="text-[9px] font-normal text-slate-400">/tháng</span>
                    </span>
                    {isVacant && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectPlotForContract(p);
                        }}
                        className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                          isPlotSelectedForContract(p)
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                        title={isPlotSelectedForContract(p) ? 'Đã chọn (bấm để bỏ)' : 'Chọn thửa đất này'}
                      >
                        {isPlotSelectedForContract(p) ? 'Đã chọn' : 'Chọn'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. PANEL CHI TIẾT THỬA ĐẤT BÊN PHẢI (SLIDE-IN DRAWER)
      ───────────────────────────────────────────────────────────────────────────── */}
      <MarketplacePlotDetailPanel
        plot={selectedPlot}
        isOpen={showDetailPanel && Boolean(selectedPlot)}
        onClose={handleCloseDetail}
        onBookPlot={handleBookPlot}
        isPlotSelectedForContract={isPlotSelectedForContract(selectedPlot)}
        onToggleSelectPlotForContract={handleToggleSelectPlotForContract}
        selectedCropId={selectedCropByPlot[selectedPlot?.id] || ''}
        onSelectCrop={(cropId) =>
          setSelectedCropByPlot((current) => ({ ...current, [selectedPlot.id]: cropId }))
        }
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MODAL XÁC THỰC THUÊ THỬA ĐẤT (CHO TÀI KHOẢN KHÁCH)
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Yêu Cầu Đăng Nhập Để Thuê Thửa Đất"
        subtitle={plotToBook ? `${plotToBook.code || plotToBook.id} • ${plotToBook.name}` : undefined}
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
              thức canh tác và thanh toán VietQR.
            </p>
          </div>

          {plotToBook && (
            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs border border-slate-200 space-y-1">
              <p>
                <strong>Thửa đất:</strong> {plotToBook.code || plotToBook.id} ({plotToBook.name})
              </p>
              <p>
                <strong>Diện tích:</strong> {plotToBook.area}
              </p>
              <p>
                <strong>Giá thuê:</strong> {plotToBook.price || `${plotToBook.rentalPrice?.toLocaleString('vi-VN')} đ`}/tháng
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              className="w-full font-bold uppercase tracking-wider text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. THANH ĐIỀU HƯỚNG GỘP HỢP ĐỒNG MASTER LEASE (KHI ĐÃ CHỌN >= 1 THỬA ĐẤT)
      ───────────────────────────────────────────────────────────────────────────── */}
      {contractSelectedPlots.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-emerald-500/40 shadow-[0_16px_50px_rgba(0,0,0,0.35)] text-white animate-fadeIn max-w-[95vw] sm:max-w-fit">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              <span className="text-sm font-black">{contractSelectedPlots.length}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Danh sách đã chọn ({contractSelectedPlots.length} thửa)
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                  {contractSelectedPlots.map((p) => p.code || p.id).join(', ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Tổng diện tích: <strong className="text-white">{totalSelectedArea} m²</strong> •{' '}
                <strong className="text-emerald-400">{totalSelectedPrice.toLocaleString('vi-VN')} đ/tháng</strong>
              </p>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-700/80 shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setContractSelectedPlots([]);
                localStorage.removeItem('farmely_master_lease_selected_plots');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleProceedToMultiPlotLease}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Tiếp tục thuê ({contractSelectedPlots.length} thửa)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
