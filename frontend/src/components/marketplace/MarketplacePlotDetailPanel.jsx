import React, { useState } from 'react';
import { Heart, Zap, X } from 'lucide-react';

export default function MarketplacePlotDetailPanel({
  plot = null,
  isOpen = true,
  onBookPlot,
  onClose
}) {
  const [isSaved, setIsSaved] = useState(false);

  if (!plot) return null;

  const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
  const displayStatus = isVacant ? 'Đang trống' : 'Đã thuê';
  const plotCode = plot.code || `Plot ${plot.id}`;
  const plotName = plot.name || `Thửa Ruộng ${plot.id}`;
  const farmName = plot.farmName || 'Happy Valley';
  const plotArea = plot.areaFormatted || (typeof plot.area === 'number' ? `${plot.area} m²` : plot.area) || '150 m²';
  const plotPrice = plot.rentalPriceFormatted || plot.price || (plot.rentalPrice ? `${plot.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
  const plotImg = plot.img || plot.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
  
  // Format crops list
  let cropsList = [];
  if (Array.isArray(plot.crops)) {
    cropsList = plot.crops;
  } else if (Array.isArray(plot.compatibleCrops)) {
    cropsList = plot.compatibleCrops.map((c) => `${c.icon || '🌱'} ${c.name}`);
  } else {
    cropsList = ['🌶️ Ớt chuông', '🍆 Cà tím', '🍅 Cà chua bi'];
  }

  // Specifications
  const direction = plot.direction || plot.specs?.orientation || 'Đông Nam';
  const phValue = plot.ph || plot.specs?.ph || '6.2 - 6.5';
  const tempValue = plot.temp || plot.specs?.temp || '20 - 28°C';

  return (
    <aside
      id="detail-panel"
      className={`absolute top-24 right-6 bottom-6 z-20 w-[380px] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
        isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[420px] opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Ảnh banner & Nút đóng */}
      <div className="relative h-44 w-full bg-slate-200 shrink-0 overflow-hidden">
        <img
          key={plotImg}
          id="detail-img"
          src={plotImg}
          alt={plotName}
          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white pointer-events-none transition-all duration-300">
          <div>
            <span
              id="detail-tag-status"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 shadow-sm transition-colors duration-300 ${
                isVacant ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
              }`}
            >
              {displayStatus}
            </span>
            <h3 id="detail-title" className="text-base font-bold leading-tight drop-shadow-md truncate max-w-[300px]">
              {plotName}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all text-sm cursor-pointer"
          title="Đóng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Nội dung chi tiết cuộn được với hiệu ứng chuyển tiếp */}
      <div
        key={plot.id}
        className="p-5 flex-1 overflow-y-auto no-scrollbar space-y-4 text-slate-700 text-xs transition-opacity duration-300"
      >
        {/* Giá & Diện tích */}
        <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
          <div>
            <p id="detail-code" className="text-sm font-bold text-slate-900">{plotCode}</p>
            <p id="detail-area" className="text-[11px] text-slate-400 mt-0.5">{farmName} • {plotArea}</p>
          </div>
          <div className="text-right">
            <span id="detail-price" className="text-lg font-black text-emerald-600">{plotPrice}</span>
            <span className="block text-[10px] text-slate-400">/ tháng</span>
          </div>
        </div>

        {/* Tiện ích có sẵn */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Tiện ích tích hợp:</h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm">💧</span> <span>Tưới nhỏ giọt</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm">📡</span> <span>Cảm biến IoT</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm">🌱</span> <span>Đất hữu cơ</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm">🌊</span> <span>Gần kênh nước</span>
            </div>
          </div>
        </div>

        {/* Cây trồng phù hợp */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Cây trồng khuyến nghị:</h4>
          <div id="detail-crops" className="flex flex-wrap gap-1.5">
            {cropsList.map((crop, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/50 rounded-lg text-[10px] font-semibold"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>

        {/* Thông số đất đai IoT */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Hướng đất:</span>
            <span id="detail-direction" className="font-semibold text-slate-800">{direction}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Độ pH đất:</span>
            <span id="detail-ph" className="font-semibold text-slate-800">{phValue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Nhiệt độ TB:</span>
            <span id="detail-temp" className="font-semibold text-slate-800">{tempValue}</span>
          </div>
        </div>
      </div>

      {/* 3. Nút hành động CTA */}
      <div className="p-4 border-t border-slate-100 bg-white/70 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => onBookPlot(plot)}
          disabled={!isVacant}
          className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            isVacant
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.98]'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isVacant ? 'Thuê ngay thửa này' : 'Thửa đất đã có người thuê'}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          <span>{isSaved ? 'Đã lưu vào quan tâm' : 'Lưu vào danh sách quan tâm'}</span>
        </button>
      </div>
    </aside>
  );
}
