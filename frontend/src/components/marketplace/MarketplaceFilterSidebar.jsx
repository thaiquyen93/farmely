import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Sprout,
  Maximize2,
  DollarSign,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export default function MarketplaceFilterSidebar({
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  selectedCrop,
  setSelectedCrop,
  areaMin,
  setAreaMin,
  areaMax,
  setAreaMax,
  priceMax,
  setPriceMax,
  facilities,
  toggleFacility,
  availableCrops,
  locations,
  onResetFilters,
  hasActiveFilters,
  compact = false
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const facilityOptions = [
    { id: 'irrigation', label: 'Hệ thống tưới', icon: '💧' },
    { id: 'iot', label: 'Cảm biến IoT', icon: '📡' },
    { id: 'waterSource', label: 'Gần nguồn nước', icon: '🌊' },
    { id: 'organicSoil', label: 'Đất hữu cơ', icon: '🍃' },
    { id: 'techSupport', label: 'Hỗ trợ kỹ thuật', icon: '🛠' }
  ];

  if (compact) {
    return (
      <section className="bg-white rounded-2xl border border-brand-border p-3 shadow-sm text-brand-dark" aria-label="Bộ lọc thửa đất">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.6fr)_1fr_1fr_auto] gap-2">
          <label className="relative">
            <span className="sr-only">Tìm thửa đất</span>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Tìm nông trại, mã thửa đất..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-11 pl-10 pr-3 text-xs bg-brand-cream/50 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </label>

          <label className="relative">
            <span className="sr-only">Địa điểm</span>
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-green pointer-events-none" />
            <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full min-h-11 pl-9 pr-8 text-xs bg-white border border-brand-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green/30 cursor-pointer">
              <option value="ALL">Tất cả khu vực</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </label>

          <label className="relative">
            <span className="sr-only">Loại cây trồng</span>
            <Sprout className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-green pointer-events-none" />
            <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="w-full min-h-11 pl-9 pr-8 text-xs bg-white border border-brand-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green/30 cursor-pointer">
              {availableCrops.map((crop, idx) => <option key={crop} value={idx === 0 ? 'ALL' : crop}>{crop}</option>)}
            </select>
          </label>

          <button type="button" onClick={() => setShowAdvanced((value) => !value)} aria-expanded={showAdvanced} className="min-h-11 px-4 rounded-xl bg-brand-green text-white text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Lọc thêm</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-brand-border grid grid-cols-1 xl:grid-cols-[1fr_1.1fr_2fr_auto] gap-3 items-end">
            <div>
              <span className="text-xs font-bold flex items-center gap-1.5 mb-1.5"><Maximize2 className="w-4 h-4 text-brand-green" />Diện tích (m²)</span>
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Diện tích tối thiểu" type="number" placeholder="Từ 50" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} className="min-h-11 px-3 text-xs rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
                <input aria-label="Diện tích tối đa" type="number" placeholder="Đến 5.000" value={areaMax} onChange={(e) => setAreaMax(e.target.value)} className="min-h-11 px-3 text-xs rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
            </div>

            <label>
              <span className="text-xs font-bold flex justify-between gap-2 mb-2"><span>Giá tối đa/tháng</span><span className="text-brand-green">{priceMax >= 10000000 ? '10 triệu+' : `${Number(priceMax).toLocaleString('vi-VN')}đ`}</span></span>
              <input type="range" min="500000" max="10000000" step="200000" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full h-2 accent-[#294C38]" />
            </label>

            <fieldset>
              <legend className="text-xs font-bold mb-1.5">Tiện ích</legend>
              <div className="flex flex-wrap gap-1.5">
                {facilityOptions.map((item) => (
                  <button key={item.id} type="button" onClick={() => toggleFacility(item.id)} aria-pressed={Boolean(facilities[item.id])} className={`min-h-9 px-2.5 rounded-full border text-xs font-semibold transition-colors ${facilities[item.id] ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-brand-border text-stone-600 hover:border-brand-green'}`}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {hasActiveFilters && (
              <button type="button" onClick={onResetFilters} className="min-h-11 px-3 text-xs font-bold text-rose-700 rounded-xl hover:bg-rose-50 inline-flex items-center justify-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Xóa lọc
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <aside className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm space-y-5 text-brand-dark">
      {/* Title */}
      <div>
        <h3 className="font-heading font-black text-base text-brand-dark tracking-tight">
          Tìm kiếm khu vực canh tác
        </h3>
        <p className="text-[11px] text-brand-muted mt-0.5">
          Khám phá và lọc các thửa đất VietGAP theo nhu cầu
        </p>
      </div>

      {/* 1. Search by keyword */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Tìm theo tên vườn, địa điểm, loại cây..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-brand-cream/50 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:bg-white text-brand-dark placeholder-stone-400 transition-all font-medium"
        />
      </div>

      {/* 2. Location Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-green" />
          <span>Địa điểm</span>
        </label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full text-xs bg-brand-cream/40 border border-brand-border rounded-xl px-3 py-2.5 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-medium cursor-pointer"
        >
          <option value="ALL">Tất cả khu vực</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.province})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Crop Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-brand-green" />
          <span>Loại cây trồng</span>
        </label>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="w-full text-xs bg-brand-cream/40 border border-brand-border rounded-xl px-3 py-2.5 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-medium cursor-pointer"
        >
          {availableCrops.map((crop, idx) => (
            <option key={idx} value={idx === 0 ? 'ALL' : crop}>
              {crop}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Area Range (m²) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-brand-green" />
          <span>Diện tích</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="text-[10px] text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2">Từ</span>
            <input
              type="number"
              placeholder="50 m²"
              value={areaMin}
              onChange={(e) => setAreaMin(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 text-xs bg-brand-cream/40 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-medium"
            />
          </div>
          <div className="relative">
            <span className="text-[10px] text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2">Đến</span>
            <input
              type="number"
              placeholder="5.000 m²"
              value={areaMax}
              onChange={(e) => setAreaMax(e.target.value)}
              className="w-full pl-9 pr-2.5 py-2 text-xs bg-brand-cream/40 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 5. Rental Price Slider */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-brand-dark flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-green" />
            <span>Giá thuê (VNĐ/tháng)</span>
          </label>
          <span className="font-bold text-brand-green text-[11px]">
            {priceMax >= 10000000 ? '10.000.000+ đ' : `${Number(priceMax).toLocaleString('vi-VN')} đ`}
          </span>
        </div>
        <input
          type="range"
          min="500000"
          max="10000000"
          step="200000"
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#294C38]"
        />
        <div className="flex justify-between text-[10px] text-stone-400 font-medium">
          <span>0 đ</span>
          <span>10.000.000+ đ</span>
        </div>
      </div>

      {/* 6. Facilities Checkboxes */}
      <div className="space-y-2.5 pt-1 border-t border-brand-border/60">
        <label className="text-xs font-bold text-brand-dark block">
          Tiện ích
        </label>
        <div className="space-y-2 text-xs">
          {facilityOptions.map((item) => {
            const isChecked = Boolean(facilities[item.id]);
            return (
              <label
                key={item.id}
                onClick={() => toggleFacility(item.id)}
                className="flex items-center gap-2 cursor-pointer select-none text-stone-700 hover:text-brand-dark transition-colors"
              >
                <span className="text-brand-green">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 fill-emerald-600 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-300" />
                  )}
                </span>
                <span className="text-sm mr-0.5">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Action Button */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-[#294C38] hover:bg-[#203c2c] text-white text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Tìm kiếm</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full py-2 text-center text-xs text-rose-600 hover:underline font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa tất cả bộ lọc</span>
          </button>
        )}
      </div>
    </aside>
  );
}
