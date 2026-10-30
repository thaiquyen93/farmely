import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import { buildGeoJsonFromDbPlots } from '../../data/marketplaceGisData';
import { farmApi } from '../../api/farm/farmApi';
import { getSafeCropById, safeCrops, getSafeCropsList, registerDynamicCrops } from '../../data/safeCrops';
import { getStatusConfig, isAvailableStatus } from '../../utils/mapTheme';
import {
  normalizePlotCode,
  findPlotByCode,
  loadCartCodes,
  saveCartCodes,
  dedupeCodes,
  buildBookingUrl,
  filterCompatibleCrops,
  fetchCompatibleVarietyIds,
  loadLeaseConfigMap,
  saveLeaseConfigMap,
  normalizeLeaseConfig,
  buildCartSummary
} from '../../utils/leaseSelection';
import { LogIn, Search, X, ChevronRight, Sparkles, ArrowRight, Check, Plus, MapPin, Layers, Calendar, Compass, Bus } from 'lucide-react';
import SiteVisitForm from '../../components/public/SiteVisitForm';

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hasPromptedAuthRef = useRef(false);
  // Cấu hình thuê theo mã thửa (vd {"P-04": { cropId: "CRP-03", cultivationMode: "ASSISTED", termMonths: 6 }}), dùng chung với trang BookPlot
  const [leaseConfigByPlot, setLeaseConfigByPlot] = useState(loadLeaseConfigMap);
  // Danh sách mã thửa cần thuê khi chưa đăng nhập (dùng sau khi đăng nhập)
  const [pendingBookingCodes, setPendingBookingCodes] = useState([]);

  // Modal Đặt Lịch Khảo Sát Nông Trại Thực Tế (cho khách chưa login hoặc chưa vội thuê)
  const [showSiteVisitModal, setShowSiteVisitModal] = useState(false);
  const [siteVisitPlot, setSiteVisitPlot] = useState(null);

  const handleOpenSiteVisit = (plot = null) => {
    setSiteVisitPlot(plot || selectedPlot || null);
    setShowSiteVisitModal(true);
  };

  useEffect(() => {
    saveLeaseConfigMap(leaseConfigByPlot);
  }, [leaseConfigByPlot]);

  const updatePlotLeaseConfig = (plotCode, patch) => {
    const code = normalizePlotCode(plotCode);
    if (!code) return;
    setLeaseConfigByPlot((prev) => {
      const current = prev[code] || {};
      const merged = { ...current, ...patch };
      const crop = getSafeCropById(merged.cropId);
      const normalized = normalizeLeaseConfig(merged, crop);
      const next = { ...prev, [code]: normalized };
      saveLeaseConfigMap(next);
      return next;
    });
  };

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

        let plotList = [];
        if (plotsRes.status === 'fulfilled' && Array.isArray(plotsRes.value)) {
          // Chỉ hiển thị trên Marketplace các thửa đất đã được Admin kích hoạt (isPublished = true)
          plotList = plotsRes.value.filter(
            (p) => p.isPublished !== false && p.is_published !== false
          );
          setDbPlots(plotList);
        } else {
          setDbPlots([]);
        }

        let landList = [];
        if (landsRes.status === 'fulfilled' && Array.isArray(landsRes.value)) {
          const publishedLandIds = new Set(plotList.map((p) => String(p.landId)));
          // Chỉ hiển thị khu đất đã được Admin chuyển trạng thái Active/Published lên Marketplace
          landList = landsRes.value.filter(
            (l) =>
              (l.isPublished !== false && l.is_published !== false) ||
              publishedLandIds.has(String(l.landId))
          );
          setLands(landList);
        }

        if (landList.length > 0) {
          const urlLandId = searchParams.get('landId');
          const urlPlotId = searchParams.get('plotId') || searchParams.get('plot') || searchParams.get('plots');
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
            if (foundPlot) {
              const codeToSelect = foundPlot.plotCode || String(foundPlot.plotId);
              setSelectedPlotId(codeToSelect);
              setShowDetailPanel(true);

              const isAuthReq = searchParams.get('authRequired') === 'true' || searchParams.get('requireAuth') === 'true';
              if (isAuthReq && !isAuthenticated && !hasPromptedAuthRef.current) {
                hasPromptedAuthRef.current = true;
                const areaNum = Number(foundPlot.area || foundPlot.size || 100);
                const priceNum = Number(foundPlot.pricePerPeriod ?? foundPlot.rentalPrice ?? 1200000);
                setPlotToBook({
                  ...foundPlot,
                  id: codeToSelect,
                  code: codeToSelect,
                  name: foundPlot.name || `Thửa đất ${codeToSelect}`,
                  area: `${areaNum} m²`,
                  price: `${priceNum.toLocaleString('vi-VN')} đ/tháng`,
                  rentalPrice: priceNum
                });
                setPendingBookingCodes([codeToSelect]);
                setShowAuthModal(true);
              }
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

  // Bộ lọc GeoJSON tương tác động theo statusFilter
  const displayedPlotsGeoJson = useMemo(() => {
    if (statusFilter === 'AVAILABLE') {
      const filtered = plotsForCurrentLand.filter(
        (p) => p.status === 'AVAIL' || p.status === 'AVAILABLE' || p.status === 'Đang trống'
      );
      return buildGeoJsonFromDbPlots(filtered);
    }
    if (statusFilter === 'RENTED') {
      const filtered = plotsForCurrentLand.filter(
        (p) => p.status === 'RENT' || p.status === 'RENTED' || p.status === 'Đã thuê'
      );
      return buildGeoJsonFromDbPlots(filtered);
    }
    return livePlotsGeoJson;
  }, [statusFilter, plotsForCurrentLand, livePlotsGeoJson]);

  // Giỏ thuê: nguồn sự thật duy nhất là danh sách MÃ thửa (vd ["P-04","P-05"]) trong localStorage.
  // Thông tin thửa luôn suy ra từ dữ liệu DB hiện tại theo mã chính xác, không lưu object.
  const [cartCodes, setCartCodes] = useState(loadCartCodes);

  useEffect(() => {
    saveCartCodes(cartCodes);
  }, [cartCodes]);

  // Toàn bộ thửa (mọi khu đất) để thửa trong giỏ thuộc khu khác vẫn hiển thị đúng
  const allDbPlotProps = useMemo(() => {
    return buildGeoJsonFromDbPlots(dbPlots).features.map((f) => f.properties);
  }, [dbPlots]);

  const contractSelectedPlots = useMemo(() => {
    return cartCodes.map((code) => findPlotByCode(allDbPlotProps, code)).filter(Boolean);
  }, [cartCodes, allDbPlotProps]);

  const getPlotKey = (plot) => normalizePlotCode(plot?.code || plot?.id);

  // Thửa đất đang được chọn (null nếu chưa chọn thửa nào)
  const selectedPlot = useMemo(() => {
    if (!selectedPlotId) return null;
    return allPlots.find((p) => p.id === selectedPlotId || p.code === selectedPlotId) || null;
  }, [allPlots, selectedPlotId]);

  // Tự động bật Modal Đăng nhập để tiếp tục khi URL yêu cầu authRequired mà khách chưa đăng nhập
  useEffect(() => {
    const isAuthRequired = searchParams.get('authRequired') === 'true' || searchParams.get('requireAuth') === 'true';
    if (isAuthRequired && !isAuthenticated && selectedPlot && !hasPromptedAuthRef.current) {
      hasPromptedAuthRef.current = true;
      setPlotToBook(selectedPlot);
      setPendingBookingCodes([selectedPlot.code || selectedPlot.id]);
      setShowAuthModal(true);
    }
  }, [searchParams, isAuthenticated, selectedPlot]);

  // Chọn thửa đất
  const handleSelectPlot = (plot) => {
    if (!plot) return;
    const id = plot.id || plot.code;
    setSelectedPlotId(id);
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
  };

  const handleToggleSelectPlotForContract = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.statusCode === 'AVAIL';
    if (!isVacant) return;

    const code = getPlotKey(plot);
    if (!code) return;
    setCartCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const removeFromCart = (code) => {
    const target = normalizePlotCode(code);
    setCartCodes((prev) => prev.filter((c) => c !== target));
  };

  const isPlotSelectedForContract = (plot) => {
    if (!plot) return false;
    return cartCodes.includes(getPlotKey(plot));
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

  // "Thuê ngay thửa này": thuê thửa này và kết hợp cùng các thửa đã chọn trong hợp đồng
  const handleBookPlot = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.statusCode === 'AVAIL';
    if (!isVacant) return;

    const code = getPlotKey(plot);
    if (!code) return;

    // Nếu người dùng đã có các thửa được chọn trong hợp đồng, kết hợp tất cả các thửa
    const codes = cartCodes && cartCodes.length > 0
      ? dedupeCodes([...cartCodes, code])
      : [code];

    saveLeaseConfigMap(leaseConfigByPlot);
    const primaryCode = codes[0];
    const cfg = leaseConfigByPlot[primaryCode];

    if (!isAuthenticated) {
      setPlotToBook(contractSelectedPlots[0] || plot);
      setPendingBookingCodes(codes);
      setShowAuthModal(true);
    } else {
      navigate(buildBookingUrl(codes, cfg));
    }
  };

  // "Tiếp tục thuê (N thửa)": thuê đúng các thửa trong giỏ
  const handleProceedToMultiPlotLease = () => {
    // Dùng đúng danh sách đang hiển thị trên thanh giỏ (đã đối chiếu với DB)
    const codes = contractSelectedPlots.map(getPlotKey).filter(Boolean);
    if (codes.length === 0) return;

    saveLeaseConfigMap(leaseConfigByPlot);
    const primaryCode = codes[0];
    const cfg = leaseConfigByPlot[primaryCode];

    if (!isAuthenticated) {
      setPlotToBook(contractSelectedPlots[0] || null);
      setPendingBookingCodes(codes);
      setShowAuthModal(true);
    } else {
      navigate(buildBookingUrl(codes, cfg));
    }
  };

  const handleQuickDemoLogin = async () => {
    await login('customer@farmely.vn', '123456');
    setShowAuthModal(false);
    if (pendingBookingCodes.length > 0) {
      saveLeaseConfigMap(leaseConfigByPlot);
      const primaryCode = pendingBookingCodes[0];
      const cfg = leaseConfigByPlot[primaryCode];
      navigate(buildBookingUrl(pendingBookingCodes, cfg));
    }
  };

  // BR03: chỉ hiển thị giống cây tương thích với thửa đang mở (theo plot_variety_compatibility)
  const [compatByPlotId, setCompatByPlotId] = useState({});
  const [allCrops, setAllCrops] = useState(getSafeCropsList);
  const selectedPlotDbId =
    selectedPlot?.plot_id ??
    selectedPlot?.plotId ??
    (selectedPlot?.code ? Number(String(selectedPlot.code).replace(/^P-?/i, '')) : null);

  useEffect(() => {
    let active = true;
    fetch('/api/varieties')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active) return;
        const rows = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rows) && rows.length > 0) {
          const merged = registerDynamicCrops(rows);
          setAllCrops(merged);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedPlotDbId === undefined || selectedPlotDbId === null || isNaN(selectedPlotDbId)) return;
    let active = true;
    fetchCompatibleVarietyIds(selectedPlotDbId, true).then((ids) => {
      if (active) {
        setAllCrops(getSafeCropsList());
        setCompatByPlotId((prev) => ({ ...prev, [selectedPlotDbId]: ids }));
      }
    });
    return () => {
      active = false;
    };
  }, [selectedPlotDbId]);

  const selectedPlotCompat = useMemo(() => {
    return filterCompatibleCrops(allCrops, selectedPlotDbId != null ? compatByPlotId[selectedPlotDbId] : null);
  }, [allCrops, compatByPlotId, selectedPlotDbId]);
  const selectedPlotCompatLoaded = selectedPlotDbId != null && selectedPlotDbId in compatByPlotId;

  const selectedPlotKey = getPlotKey(selectedPlot);
  const selectedPlotConfig = useMemo(() => {
    const raw = leaseConfigByPlot[selectedPlotKey] || {};
    const crop = getSafeCropById(raw.cropId);
    return normalizeLeaseConfig(raw, crop);
  }, [leaseConfigByPlot, selectedPlotKey]);

  // Bỏ giống cây đã lưu nếu không tương thích với thửa (khi DB có dữ liệu tương thích)
  useEffect(() => {
    if (!selectedPlotKey || !selectedPlotConfig.cropId || !selectedPlotCompat.hasData) return;
    if (!selectedPlotCompat.crops.some((c) => c.id === selectedPlotConfig.cropId)) {
      updatePlotLeaseConfig(selectedPlotKey, { cropId: '' });
    }
  }, [selectedPlotKey, selectedPlotConfig.cropId, selectedPlotCompat]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. BẢN ĐỒ VỆ TINH TRÀN TOÀN BỘ MÀN HÌNH (MapLibre GL JS + ESRI Satellite)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div id="map" className="absolute inset-0 z-0 w-full h-full">
        <MarketplaceInteractiveMap
          plotsData={displayedPlotsGeoJson}
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
      <header className="absolute left-2 right-2 top-3 z-30 mx-auto flex w-fit max-w-[95vw] lg:max-w-5xl xl:max-w-6xl items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto sm:left-4 sm:right-4 sm:rounded-full sm:px-5">
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

        {/* Badge Live DB Indicator (Hiển thị trên màn hình rộng để không chiếm chỗ menu) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 rounded-full shadow-2xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            PostgreSQL: {allPlots.length === dbPlots.length ? `${dbPlots.length} Thửa` : `${allPlots.length}/${dbPlots.length} Thửa`} {lands.length > 0 ? `· ${lands.length} Khu đất` : ''}
          </span>
        </div>

        {/* Phân cách mờ */}
        <div className="hidden xl:block h-4 w-[1px] bg-slate-200/80 shrink-0" />

        {/* Menu liên kết phong cách Pill */}
        <nav className="hidden sm:flex shrink-0 items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-600">
          <Link
            to="/"
            className="whitespace-nowrap px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            Trang chủ
          </Link>
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 shadow-2xs transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Marketplace
          </Link>
          <button
            type="button"
            onClick={() => handleOpenSiteVisit(selectedPlot || null)}
            className="whitespace-nowrap rounded-full border border-emerald-300/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs transition-all hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>Đặt lịch tham quan</span>
          </button>
          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <Link
              to="/customer/dashboard"
              className="whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-emerald-700 transition-all hover:bg-emerald-50"
            >
              Vườn của tôi
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin/master-data/lands"
              className="whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-emerald-700 transition-all hover:bg-emerald-50"
            >
              Quản lý Đất & Thửa
            </Link>
          )}
        </nav>

        {/* Phân cách mờ */}
        <div className="hidden h-4 w-px shrink-0 bg-slate-200/80 sm:block" />

        {/* Nút Đăng nhập / Tài khoản */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/login"
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100/70 hover:text-slate-900"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95"
            >
              Đăng ký
            </Link>
          </div>
        ) : (
          <Link
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs transition-all hover:bg-emerald-100/80 active:scale-95"
          >
            <span className="text-sm">🌿</span>
            <span>{user?.name ? user.name.split(' ').slice(-1)[0] : 'Tài khoản'}</span>
          </Link>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BỘ LỌC TRẠNG THÁI NỔI TRÊN BẢN ĐỒ (FLOATING QUICK FILTER PILLS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-20 left-3 sm:left-6 z-20 flex flex-wrap items-center gap-1.5 p-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-float border border-white/80 pointer-events-auto">
        {lands.length > 1 && (
          <div className="flex items-center gap-1 pl-1.5 pr-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
              className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer py-1"
            >
              {lands.map((l) => (
                <option key={l.landId} value={String(l.landId)}>
                  {l.landName}
                </option>
              ))}
              <option value="ALL">Tất cả nông trại ({lands.length})</option>
            </select>
            <div className="h-4 w-px bg-slate-200/80 mx-1" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          Tất cả ({allPlots.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            statusFilter === 'AVAILABLE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${statusFilter === 'AVAILABLE' ? 'bg-white' : 'bg-emerald-500'}`} />
          Đang trống ({allPlots.filter((p) => p.status === 'Đang trống' || p.status === 'AVAILABLE' || p.statusCode === 'AVAIL').length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RENTED')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            statusFilter === 'RENTED'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          Đã thuê ({allPlots.filter((p) => p.status === 'Đã thuê' || p.status === 'RENTED' || p.statusCode === 'RENT').length})
        </button>
      </div>

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
        leaseConfig={selectedPlotConfig}
        onChangeLeaseConfig={(patch) => updatePlotLeaseConfig(selectedPlotKey, patch)}
        cropOptions={selectedPlotCompat.crops}
        compatibilityMissing={selectedPlotCompatLoaded && !selectedPlotCompat.hasData}
        onOpenSiteVisit={handleOpenSiteVisit}
        cartPlotsCount={contractSelectedPlots.length}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MODAL XÁC THỰC THUÊ THỬA ĐẤT (CHO TÀI KHOẢN KHÁCH)
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Đăng Nhập Để Tiếp Tục"
        subtitle={plotToBook ? `${plotToBook.code || plotToBook.id} • ${plotToBook.name}` : undefined}
      >
        <div className="space-y-4 text-center py-2 text-slate-800">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <LogIn className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="font-heading font-black text-lg text-slate-900">
              Đăng nhập để tiếp tục
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Vui lòng đăng nhập tài khoản khách hàng để xem chi tiết đầy đủ, chọn mô hình canh tác và ký hợp đồng thuê thửa đất.
            </p>
          </div>

          {plotToBook && (
            <div className="p-3.5 bg-slate-50 rounded-2xl text-left text-xs border border-slate-200/80 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{plotToBook.code || plotToBook.id}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {plotToBook.name || `Thửa đất ${plotToBook.code || plotToBook.id}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                <span>Diện tích:</span>
                <span className="font-semibold text-slate-900">{plotToBook.area || '150 m²'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Đơn giá niêm yết:</span>
                <span className="font-bold text-emerald-700">
                  {plotToBook.formattedPrice || plotToBook.price || (plotToBook.rentalPrice ? `${plotToBook.rentalPrice.toLocaleString('vi-VN')} đ/tháng` : '1.200.000 đ/tháng')}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <Button
              variant="primary"
              className="w-full font-bold uppercase tracking-wider text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl shadow-md cursor-pointer"
              onClick={() => {
                setShowAuthModal(false);
                const primaryCode = pendingBookingCodes[0];
                const cfg = primaryCode ? leaseConfigByPlot[primaryCode] : null;
                navigate(`/login?redirect=${encodeURIComponent(buildBookingUrl(pendingBookingCodes, cfg))}`);
              }}
            >
              Đăng nhập ngay
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              onClick={handleQuickDemoLogin}
            >
              Đăng nhập nhanh (Tài khoản mẫu Khách Hàng)
            </Button>

            <div className="pt-1 flex items-center justify-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  const primaryCode = pendingBookingCodes[0];
                  const cfg = primaryCode ? leaseConfigByPlot[primaryCode] : null;
                  navigate(`/register?redirect=${encodeURIComponent(buildBookingUrl(pendingBookingCodes, cfg))}`);
                }}
                className="text-brand-green font-bold hover:underline cursor-pointer"
              >
                Chưa có tài khoản? Đăng ký →
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Xem trên bản đồ trước
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. THANH ĐIỀU HƯỚNG GỘP HỢP ĐỒNG MASTER LEASE (KHI ĐÃ CHỌN >= 1 THỬA ĐẤT)
      ───────────────────────────────────────────────────────────────────────────── */}
      {contractSelectedPlots.length > 0 && (() => {
        const cartSummary = buildCartSummary(contractSelectedPlots, leaseConfigByPlot, getSafeCropById);
        return (
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-4 px-5 py-3 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-emerald-500/40 shadow-[0_16px_50px_rgba(0,0,0,0.35)] text-white animate-fadeIn max-w-[95vw] sm:max-w-fit ${
              showDetailPanel && selectedPlot ? 'hidden sm:flex' : 'flex'
            }`}
            style={
              showDetailPanel && selectedPlot
                ? { left: 'calc((100vw - 356px) / 2)', maxWidth: 'calc(100vw - 380px)' }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
                <span className="text-sm font-black">{contractSelectedPlots.length}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Danh sách đã chọn ({contractSelectedPlots.length} thửa)
                  </span>
                  <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-[440px]" aria-label="Thửa đất trong giỏ thuê">
                    {cartSummary.items.map((item) => {
                      const code = item.code;
                      const crop = item.crop;
                      const mode = item.config.cultivationMode;
                      const termMonths = item.config.termMonths;
                      const modeLabel = mode === 'ASSISTED' ? 'Hỗ trợ' : mode === 'SELF' ? 'Tự trồng' : 'Chưa chọn';
                      const hasError = Boolean(item.error);

                      return (
                        <li
                          key={code}
                          data-cart-code={code}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full pl-2 pr-0.5 py-0.5 text-xs font-bold text-white border transition-all ${
                            hasError
                              ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                          title={item.error || `${code} • ${crop?.variety || 'Chưa chọn giống'} • ${modeLabel} • ${termMonths} tháng`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const targetPlot = findPlotByCode(allDbPlotProps, code);
                              if (targetPlot) {
                                if (targetPlot.landId && targetPlot.landId !== selectedLandId) {
                                  setSelectedLandId(targetPlot.landId);
                                }
                                setSelectedPlot(targetPlot);
                                setShowDetailPanel(true);
                              }
                            }}
                            className="hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{code}</span>
                            <span>·</span>
                            <span>{crop ? crop.icon : '⚠'}</span>
                            <span>·</span>
                            <span>{termMonths}th</span>
                            <span>·</span>
                            <span className={!mode ? 'text-rose-400 font-extrabold' : 'text-slate-300'}>{modeLabel}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(code)}
                            aria-label={`Bỏ thửa ${code} khỏi danh sách`}
                            title={`Bỏ thửa ${code} khỏi danh sách`}
                            className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-rose-500/80 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Tổng diện tích: <strong className="text-white">{totalSelectedArea} m²</strong> •{' '}
                  <strong className="text-emerald-400">Tạm tính: {cartSummary.total.toLocaleString('vi-VN')} đ</strong>
                  {contractSelectedPlots.length - cartSummary.configuredCount > 0 && (
                    <span className="text-amber-400 font-bold ml-1.5">
                      ({contractSelectedPlots.length - cartSummary.configuredCount} thửa chưa cấu hình)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-700/80 shrink-0" />

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCartCodes([])}
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
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. MODAL ĐẶT LỊCH THAM QUAN THỰC ĐỊA
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showSiteVisitModal}
        onClose={() => setShowSiteVisitModal(false)}
        title="Đặt Lịch Khảo Sát Nông Trại Thực Tế"
        subtitle={
          siteVisitPlot
            ? `Khảo sát thửa ${siteVisitPlot.code || siteVisitPlot.id} • Trang trại Happy Valley Củ Chi`
            : 'Khảo sát thực địa • Miễn phí xe đưa đón cuối tuần'
        }
        maxWidth="max-w-2xl"
      >
        <div className="py-1">
          <SiteVisitForm
            preselectedPlotId={siteVisitPlot?.code || siteVisitPlot?.id || siteVisitPlot?.plotId}
            inModal={true}
            onSuccess={() => {
              // Đóng hoặc giữ xem phiếu hẹn
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
