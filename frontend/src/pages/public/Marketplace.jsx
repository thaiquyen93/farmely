import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import { buildGeoJsonFromDbPlots } from '../../data/marketplaceGisData';
import { farmApi } from '../../api/farm/farmApi';
import { getSafeCropById } from '../../data/safeCrops';
import { getStatusConfig, isAvailableStatus } from '../../utils/mapTheme';
import { LogIn, Search, X, ChevronRight, ChevronLeft, Sparkles, ArrowRight, Check, Plus, MapPin, Layers } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPlotListCollapsed, setIsPlotListCollapsed] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 1365px)').matches : false
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

  // Dữ liệu Nông trại & Thửa đất thực tế lấy từ Backend PostgreSQL Database
  const [lands, setLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState(() => {
    return localStorage.getItem('farmely_selected_land_id') || 'ALL';
  });
  const [dbPlots, setDbPlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDataFromDb() {
      setIsLoading(true);
      try {
        const [landsRes, plotsRes] = await Promise.allSettled([
          farmApi.listLands(),
          farmApi.listPlots()
        ]);
        if (!active) return;

        let landList = [];
        if (landsRes.status === 'fulfilled' && Array.isArray(landsRes.value)) {
          landList = landsRes.value;
          setLands(landList);
        }

        let plotList = [];
        if (plotsRes.status === 'fulfilled' && Array.isArray(plotsRes.value)) {
          plotList = plotsRes.value;
          setDbPlots(plotList);
        } else {
          setDbPlots([]);
        }

        if (landList.length > 0) {
          const urlLandId = searchParams.get('landId');
          const urlPlotId = searchParams.get('plotId') || searchParams.get('plots');
          let matchedPlotLandId = null;
          if (urlPlotId && plotList.length > 0) {
            const firstPlotCode = urlPlotId.split(',')[0].trim().toLowerCase();
            const foundPlot = plotList.find((p) =>
              String(p.plotId) === firstPlotCode ||
              String(p.plotCode || '').toLowerCase() === firstPlotCode
            );
            if (foundPlot?.landId) {
              matchedPlotLandId = String(foundPlot.landId);
            }
          }

          const savedLandId = localStorage.getItem('farmely_selected_land_id');

          // Ưu tiên đất có plots trong database để người dùng luôn thấy ngay thửa đất
          const landWithPlots = landList.find((l) => plotList.some((p) => String(p.landId) === String(l.landId)));

          let targetLandId = null;
          if (urlLandId && landList.some((l) => String(l.landId) === String(urlLandId))) {
            targetLandId = String(urlLandId);
          } else if (matchedPlotLandId && landList.some((l) => String(l.landId) === matchedPlotLandId)) {
            targetLandId = matchedPlotLandId;
          } else if (
            savedLandId &&
            landList.some((l) => String(l.landId) === String(savedLandId)) &&
            plotList.some((p) => String(p.landId) === String(savedLandId))
          ) {
            targetLandId = String(savedLandId);
          } else if (landWithPlots) {
            targetLandId = String(landWithPlots.landId);
          } else if (savedLandId && landList.some((l) => String(l.landId) === String(savedLandId))) {
            targetLandId = String(savedLandId);
          } else {
            targetLandId = String(landList[0]?.landId || '1');
          }

          if (targetLandId) {
            setSelectedLandId(targetLandId);
            localStorage.setItem('farmely_selected_land_id', targetLandId);
          }
        }
      } catch (err) {
        console.warn('[Marketplace] Error loading live DB data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDataFromDb();
    const handleFocus = () => loadDataFromDb();
    const handlePlotBooked = () => loadDataFromDb();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('farmely_plot_booked', handlePlotBooked);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('farmely_plot_booked', handlePlotBooked);
    };
  }, [searchParams]);

  // Nông trại hiện tại đang chọn
  const currentLand = useMemo(() => {
    if (selectedLandId === 'ALL') {
      return lands.length === 1 ? lands[0] : null;
    }
    return lands.find((l) => String(l.landId) === String(selectedLandId)) || (lands.length > 0 ? lands[0] : null);
  }, [lands, selectedLandId]);

  // Lọc thửa đất theo Nông trại đã chọn
  const plotsForCurrentLand = useMemo(() => {
    if (selectedLandId === 'ALL') return dbPlots;
    return dbPlots.filter((p) => String(p.landId) === String(selectedLandId));
  }, [dbPlots, selectedLandId]);

  // Chuyển đổi dữ liệu từ PostgreSQL thành GeoJSON FeatureCollection chuẩn MapLibre
  const livePlotsGeoJson = useMemo(() => {
    return buildGeoJsonFromDbPlots(plotsForCurrentLand);
  }, [plotsForCurrentLand]);
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
        (Array.isArray(p.crops) && p.crops.some((c) => c.toLowerCase().includes(q)))
    );
  }, [allPlots, searchQuery, statusFilter]);

  // Thửa đất đang được chọn (null nếu chưa chọn thửa nào)
  const selectedPlot = useMemo(() => {
    if (!selectedPlotId) return null;
    return allPlots.find((p) => p.id === selectedPlotId || p.code === selectedPlotId) || null;
  }, [allPlots, selectedPlotId]);

  // Chọn thửa đất
  const handleSelectPlot = (plot) => {
    if (!plot) return;
    const id = plot.id || plot.code;
    setSelectedPlotId(id);
    setShowDetailPanel(true);
    setTimeout(() => {
      const el = document.getElementById(`plot-card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
  };

  const handleToggleSelectPlotForContract = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.statusCode === 'AVAIL';
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

  // Tổng diện tích đã chọn
  const totalSelectedArea = useMemo(() => {
    return contractSelectedPlots.reduce((sum, p) => {
      const num = p.sizeNumber || parseInt(String(p.area).replace(/\D/g, ''), 10) || 0;
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

  const handleBookPlot = (plot, cropId = selectedCropId) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.statusCode === 'AVAIL';
    if (!isVacant) return;

    if (cropId) {
      try {
        const current = JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
        current[plot.id] = cropId;
        current[plot.code] = cropId;
        localStorage.setItem('farmely_selected_crop_by_plot', JSON.stringify(current));
      } catch (e) {
        console.error(e);
      }
    }

    const allSelected = isPlotSelectedForContract(plot)
      ? contractSelectedPlots
      : contractSelectedPlots.length > 0
      ? [...contractSelectedPlots.filter((p) => String(p.id) !== String(plot.id) && String(p.code) !== String(plot.code)), plot]
      : [plot];

    const firstPlot = allSelected[0];
    const uniqueCodes = [...new Set(allSelected.map((p) => p.code || p.id))];
    const plotCodes = uniqueCodes.join(',');

    if (!isAuthenticated) {
      setPlotToBook(firstPlot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${firstPlot.id || firstPlot.code}/book?plots=${plotCodes}${cropId ? `&cropId=${cropId}` : ''}`);
    }
  };

  const handleProceedToMultiPlotLease = () => {
    if (contractSelectedPlots.length === 0) return;
    const firstPlot = contractSelectedPlots[0];
    const plotCodes = contractSelectedPlots.map((p) => p.code || p.id).join(',');

    if (selectedCropId) {
      try {
        const current = JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
        contractSelectedPlots.forEach((p) => {
          current[p.id] = selectedCropId;
          if (p.code) current[p.code] = selectedCropId;
        });
        localStorage.setItem('farmely_selected_crop_by_plot', JSON.stringify(current));
      } catch (e) {
        console.error(e);
      }
    }

    if (!isAuthenticated) {
      setPlotToBook(firstPlot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${firstPlot.id || firstPlot.code}/book?plots=${plotCodes}${selectedCropId ? `&cropId=${selectedCropId}` : ''}`);
    }
  };

  const handleQuickDemoLogin = () => {
    login('customer@farmely.vn', '123456');
    setShowAuthModal(false);
    if (plotToBook) {
      const plotCodes = contractSelectedPlots.length > 0
        ? contractSelectedPlots.map((p) => p.code || p.id).join(',')
        : (plotToBook.code || plotToBook.id);
      navigate(`/marketplace/plot/${plotToBook.id || plotToBook.code}/book?plots=${plotCodes}`);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. BẢN ĐỒ VỆ TINH TRÀN TOÀN BỘ MÀN HÌNH (MapLibre GL JS + ESRI Satellite)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div id="map" className="absolute inset-0 z-0 w-full h-full">
        <MarketplaceInteractiveMap
          plotsData={livePlotsGeoJson}
          farmBoundary={currentLand?.boundary && currentLand.boundary.length >= 3 ? currentLand.boundary : null}
          farmName={currentLand?.landName || (lands.length > 0 ? `${lands.length} Nông trại` : '')}
          selectedPlot={selectedPlot}
          onSelectPlot={handleSelectPlot}
          onResetView={() => {
            setSelectedPlotId(null);
            setShowDetailPanel(false);
          }}
          detailPanelOpen={showDetailPanel && Boolean(selectedPlot)}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. THANH ĐIỀU HƯỚNG CAPSULE LƠ LỬNG (FLOATING ISLAND CAPSULE NAVBAR)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="absolute left-2 right-2 top-3 z-30 mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/95 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto sm:left-4 sm:right-4 sm:rounded-full sm:px-4">
        {/* Logo Farmely */}
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

        {/* Badge Live DB Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 rounded-full shadow-2xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            PostgreSQL: {allPlots.length === dbPlots.length ? `${dbPlots.length} Thửa` : `${allPlots.length}/${dbPlots.length} Thửa`} {lands.length > 0 ? `· ${lands.length} Khu đất` : ''}
          </span>
        </div>

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
          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <Link
              to="/customer/dashboard"
              className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 font-semibold text-emerald-700 transition-all hover:bg-emerald-50 lg:block"
            >
              Vườn của tôi
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin/master-data/lands"
              className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 font-semibold text-emerald-700 transition-all hover:bg-emerald-50 lg:block"
            >
              Quản lý Đất & Thửa
            </Link>
          )}
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
            <span>{user?.name ? user.name.split(' ')[0] : 'Trang chủ'}</span>
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
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/80 transition-all duration-300">
          {/* Header với icon & số lượng */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 tracking-tight uppercase block leading-none">
                  Thửa đất canh tác
                </span>
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hệ thống GIS Dynamic
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

          {/* Chọn Nông trại nếu có nhiều nông trại trong DB */}
          {lands.length > 1 && (
            <div className="mb-2.5 px-0.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Khu nông trại:
              </label>
              <select
                value={selectedLandId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedLandId(val);
                  setSelectedPlotId(null);
                  setShowDetailPanel(false);
                  if (val !== 'ALL') {
                    localStorage.setItem('farmely_selected_land_id', val);
                  }
                }}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {lands.map((l) => {
                  const plotCount = dbPlots.filter((p) => String(p.landId) === String(l.landId)).length;
                  return (
                    <option key={l.landId} value={String(l.landId)}>
                      {l.landName} ({plotCount} thửa)
                    </option>
                  );
                })}
                <option value="ALL">Tất cả nông trại ({dbPlots.length} thửa / {lands.length} khu)</option>
              </select>
            </div>
          )}

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
              Đang trống ({allPlots.filter(p => p.status === 'Đang trống' || p.status === 'AVAILABLE' || p.statusCode === 'AVAIL').length})
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

          {/* Danh sách thẻ thửa đất / Clean Empty State */}
          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto no-scrollbar -mx-1 px-1 py-0.5">
            {isLoading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <span className="inline-block animate-spin mr-2">⏳</span> Đang tải bản đồ vệ tinh...
              </div>
            ) : allPlots.length === 0 ? (
              <div className="py-8 px-3 text-center flex flex-col items-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mb-3 text-emerald-600 shadow-xs">
                  🌱
                </div>
                {dbPlots.length > 0 ? (
                  <>
                    <h3 className="text-xs font-black text-slate-800 mb-1">
                      Khu đất chưa phân chia thửa
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3 max-w-[240px] leading-relaxed">
                      Khu vực này hiện chưa có thửa đất. Database hiện có <strong>{dbPlots.length} thửa đất</strong> tại nông trại khác.
                    </p>
                    {(() => {
                      const landWithPlots = lands.find((l) => dbPlots.some((p) => String(p.landId) === String(l.landId)));
                      return landWithPlots ? (
                        <button
                          type="button"
                          onClick={() => {
                            const target = String(landWithPlots.landId);
                            setSelectedLandId(target);
                            localStorage.setItem('farmely_selected_land_id', target);
                          }}
                          className="w-full mb-3 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          🌿 Chuyển đến {landWithPlots.landName} ({dbPlots.filter(p => String(p.landId) === String(landWithPlots.landId)).length} thửa)
                        </button>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <>
                    <h3 className="text-xs font-black text-slate-800 mb-1">
                      Bản đồ trống (Clean State)
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-4 max-w-[240px] leading-relaxed">
                      Chưa có thửa đất nào được lưu trong Database. Quản trị viên có thể vẽ ranh giới nông trại và chia plot mới ngay.
                    </p>
                  </>
                )}
                <div className="flex flex-col gap-2 w-full">
                  <Link
                    to="/admin/master-data/lands/create"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Vẽ nông trại mới
                  </Link>
                  <Link
                    to="/admin/master-data/plots/create"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Chia thửa đất mới
                  </Link>
                </div>
              </div>
            ) : filteredPlots.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs font-semibold text-slate-600">Không tìm thấy thửa đất phù hợp</p>
                <p className="mt-1 text-[11px] text-slate-400">Thử đổi bộ lọc trạng thái</p>
              </div>
            ) : (
              filteredPlots.map((p) => {
                const statusConfig = getStatusConfig(p.status);
                const isVacant = isAvailableStatus(p.status) || p.statusCode === 'AVAIL';
                const isSelected = selectedPlot?.id === p.id;
                const inContract = isPlotSelectedForContract(p);
                const displayPrice =
                  p.price || (p.rentalPrice ? `${p.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
                const chosenCrop = getSafeCropById(selectedCropByPlot[p.id]);
                const cropLabel = chosenCrop
                  ? `${chosenCrop.icon} ${chosenCrop.name}`
                  : Array.isArray(p.crops) && p.crops.length > 0
                    ? p.crops[0]
                    : '';
                const facilities = p.facilities || {};
                const facilityIcons = [
                  facilities.irrigation && ['💧', 'Tưới tự động'],
                  facilities.iot && ['📡', 'Cảm biến IoT'],
                  facilities.organicSoil && ['🌱', 'Đất hữu cơ']
                ].filter(Boolean);

                return (
                  <div
                    id={`plot-card-${p.id}`}
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectPlot(p)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectPlot(p);
                      }
                    }}
                    className={`group relative rounded-2xl p-3 cursor-pointer transition-all duration-300 border ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : inContract
                        ? 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
                        : 'bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black tracking-tight text-slate-800">
                            {p.code || p.id}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                            style={{
                              color: isVacant ? '#047857' : statusConfig.color,
                              backgroundColor: isVacant ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.18)'
                            }}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isVacant && !isSelected ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: statusConfig.color }}
                            />
                            {statusConfig.label}
                          </span>
                        </div>
                        {p.name && (
                          <p
                            className={`mt-1 truncate text-[11px] leading-tight ${isVacant ? 'text-slate-500' : 'text-slate-400'}`}
                            title={p.name}
                          >
                            {p.name}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`block whitespace-nowrap text-[13px] font-extrabold leading-none tracking-tight ${
                            isVacant ? 'text-emerald-700' : 'text-slate-400 line-through decoration-slate-300'
                          }`}
                        >
                          {displayPrice}
                        </span>
                        <span className="mt-1 block text-[10px] leading-none text-slate-400">/ tháng</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                        <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {p.area}
                        </span>
                        {cropLabel && (
                          <span
                            className="min-w-0 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600"
                            title={cropLabel}
                          >
                            {cropLabel}
                          </span>
                        )}
                        {isVacant && facilityIcons.length > 0 && (
                          <span
                            className="shrink-0 rounded-md bg-sky-50 px-1.5 py-[3px] text-[10px] leading-none"
                            title={facilityIcons.map(([, label]) => label).join(' • ')}
                          >
                            {facilityIcons.map(([icon]) => icon).join('')}
                          </span>
                        )}
                      </div>

                      {isVacant ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectPlotForContract(p);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-pressed={inContract}
                          aria-label={inContract ? `Bỏ chọn thửa ${p.id}` : `Chọn thửa ${p.id}`}
                          title={inContract ? 'Đã chọn (bấm để bỏ)' : 'Chọn thửa đất này'}
                          className={`inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[10px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                            inContract
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700'
                              : 'border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {inContract ? (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              Đã chọn
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 stroke-[2.5]" />
                              Chọn
                            </>
                          )}
                        </button>
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
