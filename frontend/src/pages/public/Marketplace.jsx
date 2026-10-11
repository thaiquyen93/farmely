import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import MarketplaceInteractiveMap from '../../components/marketplace/MarketplaceInteractiveMap';
import MarketplacePlotDetailPanel from '../../components/marketplace/MarketplacePlotDetailPanel';
import { FARMS_GEOJSON_DATA } from '../../data/marketplaceGisData';
import { LogIn, Search, X, ChevronRight, Sparkles } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlotId, setSelectedPlotId] = useState('P-01');
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [plotToBook, setPlotToBook] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Danh sách các thửa đất từ GeoJSON
  const allPlots = useMemo(() => {
    return FARMS_GEOJSON_DATA.features.map((f) => f.properties);
  }, []);

  // Lọc theo search input & bộ lọc trạng thái
  const filteredPlots = useMemo(() => {
    let result = allPlots;
    if (statusFilter === 'AVAILABLE') {
      result = result.filter((p) => p.status === 'Đang trống' || p.status === 'AVAILABLE');
    } else if (statusFilter === 'RENTED') {
      result = result.filter((p) => p.status === 'Đã thuê' || p.status === 'RENTED');
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
    return allPlots.filter((p) => p.status === 'Đang trống' || p.status === 'AVAILABLE').length;
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

  // Tiến hành thuê thửa đất
  const handleBookPlot = (plot) => {
    if (!plot) return;
    const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
    if (!isVacant) return;

    if (!isAuthenticated) {
      setPlotToBook(plot);
      setShowAuthModal(true);
    } else {
      navigate(`/marketplace/plot/${plot.id}/book`);
    }
  };

  // Đăng nhập nhanh tài khoản mẫu khách hàng
  const handleQuickDemoLogin = () => {
    login(DEMO_ACCOUNTS.customer);
    setShowAuthModal(false);
    if (plotToBook) {
      navigate(`/marketplace/plot/${plotToBook.id}/book`);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. BẢN ĐỒ VỆ TINH TRÀN TOÀN BỘ MÀN HÌNH (MapLibre GL JS + ESRI Satellite)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div id="map" className="absolute inset-0 z-0 w-full h-full">
        <MarketplaceInteractiveMap
          plotsData={FARMS_GEOJSON_DATA}
          selectedPlot={selectedPlot}
          onSelectPlot={handleSelectPlot}
          onResetView={handleCloseDetail}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. THANH ĐIỀU HƯỚNG NỔI TRÊN CÙNG (FLOATING TOP NAV)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="absolute top-5 left-6 right-6 z-30 flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              🌱
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-800">FARMELY</span>
              <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-widest -mt-1">
                Smart Agriculture
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-slate-900 transition">
            Trang chủ
          </Link>
          <Link to="/marketplace" className="text-emerald-600 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Marketplace
          </Link>
          <Link to="/about" className="hover:text-slate-900 transition">
            Về Farmely
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Tìm mã thửa, loại cây..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-7 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-56 text-slate-800"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
              >
                <span>🌿</span>
                <span>{user?.name ? user.name.split(' ')[0] : 'Vườn của tôi'}</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BẢNG TIỆN ÍCH & DANH SÁCH BÊN TRÁI (LEFT ASIDE PANEL)
      ───────────────────────────────────────────────────────────────────────────── */}
      <aside className="absolute top-24 left-6 z-20 w-84 flex flex-col gap-3 pointer-events-auto">
        {/* Danh sách các thửa đất với hiệu ứng cao cấp */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/80 transition-all duration-300">
          {/* Header với icon & số lượng */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-xs shadow-md shadow-emerald-600/20">
                🌱
              </div>
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
          <div className="space-y-2 max-h-[calc(100vh-215px)] overflow-y-auto no-scrollbar pr-0.5">
            {filteredPlots.map((p) => {
              const isVacant = p.status === 'Đang trống' || p.status === 'AVAILABLE';
              const isSelected = selectedPlot?.id === p.id;
              const displayPrice = p.price || (p.rentalPrice ? `${p.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
              return (
                <div
                  id={`plot-card-${p.id}`}
                  key={p.id}
                  onClick={() => handleSelectPlot(p)}
                  className={`group relative p-2.5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                    isSelected
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white/95 shadow-[0_6px_20px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400/30 scale-[1.01]'
                      : 'border-slate-100/90 bg-white/90 hover:border-emerald-300/80 hover:bg-emerald-50/30 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.008]'
                  }`}
                >
                  {/* Thanh chỉ báo phát sáng góc trái khi đang chọn */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/50" />
                  )}

                  <div className="flex-1 min-w-0 pr-2 pl-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125 ${
                          isVacant
                            ? 'bg-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className={`font-black text-xs tracking-tight transition-colors ${
                        isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                      }`}>
                        {p.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded-md">
                        {p.area}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-black text-emerald-700 tracking-tight">
                        {displayPrice}<span className="text-[9px] font-normal text-slate-400">/tháng</span>
                      </span>
                      {p.crops && p.crops.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                          • {p.crops[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all duration-300 flex items-center gap-1 shadow-2xs ${
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
                      {isVacant ? 'Đang trống' : 'Đã thuê'}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all duration-300 ${
                        isSelected
                          ? 'text-emerald-600 translate-x-0.5 opacity-100'
                          : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-emerald-500'
                      }`}
                    />
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
    </div>
  );
}
