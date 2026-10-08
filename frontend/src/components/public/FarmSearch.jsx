import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Maximize2, Tag, Sprout } from 'lucide-react';
import Button from '../common/Button';
import { landsData } from '../../data/lands';
import { cropsData } from '../../data/crops';

export default function FarmSearch() {
  const [selectedLand, setSelectedLand] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedLand) params.append('landId', selectedLand);
    if (selectedCrop) params.append('crop', selectedCrop);
    if (selectedArea) params.append('area', selectedArea);
    if (selectedPrice) params.append('maxPrice', selectedPrice);
    navigate(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-elevated border border-brand-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center"
      >
        {/* Farm / Land */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-green" />
            Khu vực nông trại
          </label>
          <select
            value={selectedLand}
            onChange={(e) => setSelectedLand(e.target.value)}
            className="w-full bg-brand-cream/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-brand-dark border border-brand-border/60 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="">Tất cả nông trại</option>
            {landsData.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Crop category */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-brand-green" />
            Loại cây muốn trồng
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-brand-cream/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-brand-dark border border-brand-border/60 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="">Tất cả giống cây</option>
            {cropsData.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Plot area */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-brand-green" />
            Diện tích mong muốn
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full bg-brand-cream/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-brand-dark border border-brand-border/60 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="">Mọi diện tích</option>
            <option value="50">Khoảng 50 m² (Cơ bản)</option>
            <option value="65">Khoảng 65 m² (Gia đình)</option>
            <option value="80">Khoảng 80 m² (Năng suất)</option>
            <option value="100">100 m² trở lên (Lớn)</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-green" />
            Mức giá thuê
          </label>
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="w-full bg-brand-cream/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-brand-dark border border-brand-border/60 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="">Mọi mức giá</option>
            <option value="1200000">Dưới 1.200.000 đ/tháng</option>
            <option value="1500000">Dưới 1.500.000 đ/tháng</option>
            <option value="2000000">Dưới 2.000.000 đ/tháng</option>
          </select>
        </div>

        {/* Submit */}
        <div className="sm:col-span-2 lg:col-span-1 pt-1 sm:pt-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 text-xs sm:text-sm uppercase tracking-wider font-extrabold"
            icon={Search}
          >
            TÌM THỬA ĐẤT
          </Button>
        </div>
      </form>
    </div>
  );
}
