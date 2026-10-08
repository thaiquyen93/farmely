import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import PlotCard from '../../components/public/PlotCard';
import { plotsData } from '../../data/plots';
import { landsData } from '../../data/lands';
import { cropsData } from '../../data/crops';
import { Search, Filter, SlidersHorizontal, MapPin, Sprout, Tag, X } from 'lucide-react';
import Button from '../../components/common/Button';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedLand, setSelectedLand] = useState(searchParams.get('landId') || '');
  const [selectedCrop, setSelectedCrop] = useState(searchParams.get('crop') || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('maxPrice') || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with searchParams if url changes
  useEffect(() => {
    if (searchParams.get('landId')) setSelectedLand(searchParams.get('landId'));
    if (searchParams.get('crop')) setSelectedCrop(searchParams.get('crop'));
    if (searchParams.get('maxPrice')) setSelectedPriceRange(searchParams.get('maxPrice'));
  }, [searchParams]);

  const filteredPlots = useMemo(() => {
    return plotsData.filter((plot) => {
      if (selectedLand && plot.landId !== selectedLand) return false;
      if (selectedStatus && plot.status !== selectedStatus) return false;
      if (selectedCrop && !plot.compatibleCrops.some(c => c.toLowerCase().includes(selectedCrop.toLowerCase()))) return false;
      if (selectedPriceRange && plot.rentalPrice > parseInt(selectedPriceRange, 10)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = plot.name.toLowerCase().includes(term);
        const matchesCode = plot.code.toLowerCase().includes(term);
        const matchesSoil = plot.soilType.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesSoil) return false;
      }
      return true;
    });
  }, [selectedLand, selectedCrop, selectedStatus, selectedPriceRange, searchTerm]);

  const resetFilters = () => {
    setSelectedLand('');
    setSelectedCrop('');
    setSelectedStatus('');
    setSelectedPriceRange('');
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters = selectedLand || selectedCrop || selectedStatus || selectedPriceRange || searchTerm;

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-brand-dark text-white relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-yellow text-brand-dark uppercase tracking-wider inline-block">
            SÀN THỬA ĐẤT CANH TÁC HỮU CƠ
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Khám phá không gian <br className="hidden sm:inline" />
            <span className="text-brand-yellow">canh tác của bạn</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed">
            Mỗi thửa đất là một phân khu độc lập đã hoàn thiện rãnh thoát nước, đường cấp ẩm và trạm cảm biến IoT vi khí hậu theo quy chuẩn VietGAP.
          </p>
        </div>
      </section>

      {/* Filter and Content Area */}
      <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm theo tên thửa, mã P-101, loại đất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-brand-cream/40 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:bg-white"
              />
            </div>

            {/* Quick stats and Reset */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
              <span className="text-brand-muted">
                Tìm thấy <strong>{filteredPlots.length}</strong> thửa đất khả dụng
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-rose-600 font-bold hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-brand-border/60">
            {/* Land filter */}
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Khu vực nông trại
              </label>
              <select
                value={selectedLand}
                onChange={(e) => setSelectedLand(e.target.value)}
                className="w-full text-xs bg-brand-cream/30 border border-brand-border rounded-xl px-3 py-2 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">Tất cả khu vực</option>
                {landsData.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Crop filter */}
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Giống cây tương thích
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full text-xs bg-brand-cream/30 border border-brand-border rounded-xl px-3 py-2 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">Tất cả giống cây</option>
                {cropsData.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Trạng thái cho thuê
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs bg-brand-cream/30 border border-brand-border rounded-xl px-3 py-2 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="AVAILABLE">AVAILABLE (Đang mở cho thuê)</option>
                <option value="RESERVED">RESERVED (Đang giữ chỗ)</option>
                <option value="RENTED">RENTED (Đang canh tác)</option>
                <option value="MAINTENANCE">MAINTENANCE (Nghỉ đất 4 ngày)</option>
              </select>
            </div>

            {/* Price filter */}
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Mức giá tối đa
              </label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full text-xs bg-brand-cream/30 border border-brand-border rounded-xl px-3 py-2 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">Không giới hạn giá</option>
                <option value="1200000">≤ 1.200.000 đ/tháng</option>
                <option value="1500000">≤ 1.500.000 đ/tháng</option>
                <option value="2000000">≤ 2.000.000 đ/tháng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plot Grid */}
        {filteredPlots.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-brand-border">
            <Sprout className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-bold text-brand-dark">Không có thửa đất nào phù hợp</h3>
            <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
              Hãy thử điều chỉnh bộ lọc hoặc xóa các tiêu chí tìm kiếm để xem các thửa đất khác đang có sẵn.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
              Xóa tất cả bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlots.map((plot) => (
              <PlotCard key={plot.id} plot={plot} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
