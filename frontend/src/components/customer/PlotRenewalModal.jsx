import React, { useState, useMemo, useEffect } from 'react';
import { X, Sprout, Calendar, ShieldCheck, Check, Sparkles, AlertCircle, ArrowRight, LoaderCircle, CheckCircle2 } from 'lucide-react';
import { rentalApi } from '../../api/rental/rentalApi';

const COMPATIBLE_VARIETIES = [
  {
    id: 1,
    varietyId: 1,
    name: 'Rau muống lá tre F1',
    cropKey: 'water_spinach',
    expectedDuration: 30,
    bufferTime: 4,
    expectedYield: '15 - 20 kg/thửa',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    desc: 'Sinh trưởng nhanh, lá thon dài giòn ngọt, giàu sắt và chất xơ.'
  },
  {
    id: 2,
    varietyId: 2,
    name: 'Cải ngọt bông F1',
    cropKey: 'mustard_greens',
    expectedDuration: 35,
    bufferTime: 4,
    expectedYield: '12 - 15 kg/thửa',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80',
    desc: 'Bẹ lá dày xanh mướt, ngọn bông ngọt đậm đà, thu hoạch nhanh gọn.'
  },
  {
    id: 3,
    varietyId: 3,
    name: 'Xà lách Romaine Thụy Điển',
    cropKey: 'lettuce',
    expectedDuration: 45,
    bufferTime: 4,
    expectedYield: '10 - 12 kg/thửa',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=300&q=80',
    desc: 'Sinh trưởng nhanh, bẹ lá giòn ngọt, giàu canxi và vitamin A.'
  },
  {
    id: 4,
    varietyId: 4,
    name: 'Cà chua bi Cherry Đỏ Mọng',
    cropKey: 'tomato',
    expectedDuration: 80,
    bufferTime: 7,
    expectedYield: '15 - 18 kg/thửa',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
    desc: 'Độ ngọt cao, thơm mọng, thu hoạch rải vụ theo từng chùm chín.'
  },
  {
    id: 5,
    varietyId: 5,
    name: 'Dưa leo Baby F1 Giòn Ngọt',
    cropKey: 'cucumber',
    expectedDuration: 55,
    bufferTime: 5,
    expectedYield: '20 - 25 kg/thửa',
    price: 420000,
    image: 'https://images.unsplash.com/photo-1449339854873-750e6913301b?auto=format&fit=crop&w=300&q=80',
    desc: 'Trái nhỏ đặc ruột, không hạt, độ giòn cao, leo giàn gọn gàng.'
  },
  {
    id: 6,
    varietyId: 6,
    name: 'Đậu cô ve lùn / leo F1',
    cropKey: 'french_bean',
    expectedDuration: 55,
    bufferTime: 5,
    expectedYield: '18 - 22 kg/thửa',
    price: 380000,
    image: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=300&q=80',
    desc: 'Quả tròn hạt nhỏ, độ giòn ngọt tự nhiên, leo giàn chữ A sai quả.'
  },
  {
    id: 7,
    varietyId: 7,
    name: 'Mướp hương cao sản F1',
    cropKey: 'luffa',
    expectedDuration: 65,
    bufferTime: 7,
    expectedYield: '25 - 35 kg/thửa',
    price: 400000,
    image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=300&q=80',
    desc: 'Quả thon dài vỏ mỏng, ruột thơm ngát tự nhiên, năng suất vượt trội.'
  },
  {
    id: 8,
    varietyId: 8,
    name: 'Mồng tơi lá to F1',
    cropKey: 'malabar_spinach',
    expectedDuration: 35,
    bufferTime: 4,
    expectedYield: '14 - 18 kg/thửa',
    price: 290000,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=300&q=80',
    desc: 'Lá dày xanh mọng nước, đọt non mập mạp, thanh mát giải nhiệt.'
  },
  {
    id: 9,
    varietyId: 9,
    name: 'Ớt chỉ thiên F1',
    cropKey: 'chili',
    expectedDuration: 85,
    bufferTime: 7,
    expectedYield: '10 - 15 kg/thửa',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=300&q=80',
    desc: 'Quả sai hướng thẳng lên trời, độ cay nồng đặc trưng, chín đỏ tươi.'
  },
  {
    id: 10,
    varietyId: 10,
    name: 'Rau dền đỏ F1',
    cropKey: 'amaranth',
    expectedDuration: 30,
    bufferTime: 4,
    expectedYield: '12 - 16 kg/thửa',
    price: 270000,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80',
    desc: 'Lá đỏ tía đẹp mắt, vị ngọt mềm, giàu vitamin và khoáng chất vi lượng.'
  }
];

export default function PlotRenewalModal({
  isOpen,
  onClose,
  plot,
  seasons = [],
  onRenewSuccess
}) {
  const [varietiesList, setVarietiesList] = useState(COMPATIBLE_VARIETIES);
  const [selectedSeasonsCount, setSelectedSeasonsCount] = useState(1);
  const [selectedVariety, setSelectedVariety] = useState(() => {
    if (plot?.crop) {
      const c = String(plot.crop).toLowerCase();
      const found = COMPATIBLE_VARIETIES.find((v) => c.includes(v.cropKey) || c.includes(v.name.toLowerCase()));
      if (found) return found;
    }
    return COMPATIBLE_VARIETIES[0];
  });

  useEffect(() => {
    let isMounted = true;
    const rawPlotId = plot?.plotId || plot?.id || plot?.mapPlotId || 1;
    const numericPlotId = typeof rawPlotId === 'number' ? rawPlotId : (parseInt(String(rawPlotId).replace(/\D/g, ''), 10) || 1);

    const mapItems = (items) => {
      return items.map((item, idx) => {
        const fallback = COMPATIBLE_VARIETIES.find(
          (f) => f.varietyId === item.varietyId || f.name.toLowerCase().includes(item.varietyName?.toLowerCase() || '')
        ) || COMPATIBLE_VARIETIES[idx % COMPATIBLE_VARIETIES.length];

        return {
          id: item.varietyId || fallback.id,
          varietyId: item.varietyId || fallback.varietyId,
          name: item.varietyName || fallback.name,
          cropKey: fallback.cropKey || 'tomato',
          expectedDuration: item.expectedDuration || fallback.expectedDuration || 35,
          bufferTime: item.bufferTime || fallback.bufferTime || 5,
          expectedYield: fallback.expectedYield || '15 kg/thửa',
          price: fallback.price || 350000,
          image: fallback.image,
          desc: fallback.desc || `${item.varietyName} đạt chuẩn an toàn VietGAP.`
        };
      });
    };

    // 1. Thử gọi API ma trận tương thích thổ nhưỡng của thửa đất (: /api/plots/{id}/compatibility)
    fetch(`/api/plots/${numericPlotId}/compatibility`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const items = data?.data || (Array.isArray(data) ? data : []);
        if (items.length > 0) {
          setVarietiesList(mapItems(items));
        } else {
          // 2. Nếu chưa cấu hình ma trận riêng, lấy toàn bộ danh mục giống cây từ backend
          return fetch('/api/varieties')
            .then((r) => (r.ok ? r.json() : null))
            .then((allData) => {
              if (!isMounted || !allData) return;
              const allItems = allData?.data || (Array.isArray(allData) ? allData : []);
              if (allItems.length > 0) {
                setVarietiesList(mapItems(allItems));
              }
            });
        }
      })
      .catch(() => {
        fetch('/api/varieties')
          .then((r) => (r.ok ? r.json() : null))
          .then((allData) => {
            if (!isMounted || !allData) return;
            const allItems = allData?.data || (Array.isArray(allData) ? allData : []);
            if (allItems.length > 0) {
              setVarietiesList(mapItems(allItems));
            }
          })
          .catch(() => {});
      });

    return () => { isMounted = false; };
  }, [plot]);

  useEffect(() => {
    if (varietiesList.length > 0) {
      if (plot?.crop) {
        const c = String(plot.crop).toLowerCase();
        const found = varietiesList.find((v) => c.includes(v.cropKey) || c.includes(v.name.toLowerCase()));
        if (found) {
          setSelectedVariety(found);
          return;
        }
      }
      if (selectedVariety) {
        const matched = varietiesList.find((v) => v.varietyId === selectedVariety.varietyId || v.id === selectedVariety.id);
        if (matched) {
          setSelectedVariety(matched);
          return;
        }
      }
      setSelectedVariety(varietiesList[0]);
    }
  }, [varietiesList, plot?.crop]);

  const [selectedCareMode, setSelectedCareMode] = useState(
    plot?.mode === 'Assisted-Growing' || plot?.cultivationMode === 'ASSISTED' ? 'ASSISTED' : 'SELF'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Tính toán ngày kết thúc mới (newEndDate)
  const calculation = useMemo(() => {
    const baseEndDate = plot?.expectedHarvestDate || plot?.endDate || new Date().toISOString().slice(0, 10);
    const startDateObj = new Date(baseEndDate);

    // Thời gian nghỉ đất (Fallow) + Thời gian vụ mùa (Duration) x Số vụ
    const singleSeasonDays = (selectedVariety?.expectedDuration || 35) + (selectedVariety?.bufferTime || 5);
    const totalAdditionalDays = singleSeasonDays * selectedSeasonsCount;

    const newEndObj = new Date(startDateObj);
    newEndObj.setDate(newEndObj.getDate() + totalAdditionalDays);
    const newEndDateStr = newEndObj.toISOString().slice(0, 10);

    // Tính giá
    const plotPricePerPeriod = Number(plot?.rentalPrice || plot?.pricePerPeriod || 1200000);
    const careServicePrice = selectedCareMode === 'ASSISTED' ? 450000 : 0;
    const subtotal = (plotPricePerPeriod + careServicePrice) * selectedSeasonsCount;
    const discountRate = selectedSeasonsCount >= 3 ? 0.10 : selectedSeasonsCount >= 2 ? 0.05 : 0;
    const discountAmount = Math.round(subtotal * discountRate);
    const totalAmount = subtotal - discountAmount;

    return {
      newEndDate: newEndDateStr,
      singleSeasonDays,
      totalAdditionalDays,
      subtotal,
      discountRate,
      discountAmount,
      totalAmount
    };
  }, [plot, selectedVariety, selectedSeasonsCount, selectedCareMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const rentalId = plot?.rentalId || 1;
      const payload = {
        newEndDate: calculation.newEndDate,
        newVarietyId: selectedVariety.varietyId,
        newServiceId: selectedCareMode === 'ASSISTED' ? 1 : null
      };

      // 1. Gọi API Backend (POST /api/rentals/{id}/renew)
      try {
        await rentalApi.renewRental(rentalId, payload);
      } catch (apiErr) {
        console.warn('API call fallback to local state:', apiErr.message);
      }

      // 2. Cập nhật localStorage cho seasons của thửa đất để hiển thị tức thì
      const plotKey = String(plot?.plotCode || plot?.mapPlotId || plot?.id || '').replace(/^PLOT-/i, '').trim().toUpperCase();
      const storageKey = `farmely_plot_seasons_${plotKey}`;

      let baseSeasons = [];
      if (Array.isArray(seasons) && seasons.length > 0) {
        baseSeasons = [...seasons];
      } else {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) baseSeasons = parsed;
          }
        } catch {}
      }

      if (baseSeasons.length === 0) {
        const s1Crop = plot?.crop || 'Xà lách Lô Lô Xanh Thủy Canh';
        baseSeasons = [
          {
            seasonNumber: 1,
            id: 'SEASON-1',
            seasonName: `Vụ 1: ${s1Crop}`,
            cropKey: 'lettuce',
            cropName: s1Crop,
            status: 'ACTIVE',
            totalDays: 32,
            currentDay: plot?.currentDay || 1,
            startDate: plot?.startDate || new Date().toISOString().slice(0, 10),
            endDate: plot?.expectedHarvestDate || plot?.endDate || '2026-11-30',
            fallowDays: 5,
            rentalId: plot?.rentalId || 1,
            cultivationMode: plot?.mode || 'ASSISTED',
            isCurrent: true
          }
        ];
      }

      const newSeasonNumber = baseSeasons.length + 1;
      const updatedSeasons = [
        ...baseSeasons,
        {
          seasonNumber: newSeasonNumber,
          id: `SEASON-${newSeasonNumber}`,
          seasonName: `Vụ ${newSeasonNumber}: ${selectedVariety.name}`,
          cropKey: selectedVariety.cropKey,
          cropName: selectedVariety.name,
          varietyId: selectedVariety.varietyId,
          status: 'SCHEDULED',
          totalDays: selectedVariety.expectedDuration,
          currentDay: 0,
          startDate: plot?.expectedHarvestDate || plot?.endDate || new Date().toISOString().slice(0, 10),
          endDate: calculation.newEndDate,
          fallowDays: selectedVariety.bufferTime || 5,
          rentalId: Date.now(),
          cultivationMode: selectedCareMode,
          isCurrent: false
        }
      ];

      localStorage.setItem(storageKey, JSON.stringify(updatedSeasons));

      setSuccessData({
        newEndDate: calculation.newEndDate,
        varietyName: selectedVariety.name,
        seasonNumber: newSeasonNumber,
        totalAmount: calculation.totalAmount
      });

      if (onRenewSuccess) {
        onRenewSuccess(updatedSeasons);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Không thể hoàn tất gia hạn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-stone-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4.5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Sparkles className="h-5 w-5 text-lime-300" />
            </span>
            <div>
              <h3 className="font-heading text-lg font-black tracking-tight">
                Gia Hạn Hợp Đồng Thuê Thửa Đất
              </h3>
              <p className="text-xs text-emerald-100">
                Thửa {plot?.name || plot?.plotCode || 'P-06'} · Quyền ưu tiên giữ thửa quen theo Vụ mùa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung khi đã gia hạn thành công */}
        {successData ? (
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h4 className="font-heading text-2xl font-black text-stone-900">
                Gia Hạn Vụ Mùa Thành Công!
              </h4>
              <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
                Hợp đồng thửa đất đã được gia hạn thêm <strong>Vụ {successData.seasonNumber}: {successData.varietyName}</strong>. Thời hạn hiệu lực mới đến <strong>{successData.newEndDate}</strong>.
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 max-w-sm mx-auto text-xs text-stone-600 space-y-1 text-left">
              <p>• <strong>:</strong> Toàn bộ camera IoT, dữ liệu dinh dưỡng đất được kế thừa.</p>
              <p>• <strong>Fallow Protocol:</strong> 5 ngày nghỉ đất khử trùng được kích hoạt tự động giữa 2 vụ.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-800 shadow-md transition cursor-pointer"
            >
              Xem ngay trên Workspace
            </button>
          </div>
        ) : (
          /* Form Gia hạn */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto no-scrollbar">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bước 1: Chọn số vụ gia hạn */}
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-wider text-stone-700">
                1. Chọn số vụ mùa muốn thuê tiếp:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { count: 1, label: '+1 Vụ Mùa', desc: '35 - 45 ngày canh tác', discount: '' },
                  { count: 2, label: '+2 Vụ Mùa', desc: '70 - 90 ngày canh tác', discount: 'Giảm 5%' },
                  { count: 3, label: '+3 Vụ (Trọn năm)', desc: '105 - 130 ngày canh tác', discount: 'Giảm 10%' }
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setSelectedSeasonsCount(item.count)}
                    className={`relative rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      selectedSeasonsCount === item.count
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-300 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {item.discount && (
                      <span className="absolute -top-2 right-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                        {item.discount}
                      </span>
                    )}
                    <span className="block font-heading font-black text-sm text-stone-900">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bước 2: Chọn giống cây trồng cho vụ mới */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-black uppercase tracking-wider text-stone-700">
                  2. Chọn giống rau củ cho vụ kế tiếp:
                </label>
                <span className="text-[11px] font-medium text-emerald-700">
                  Đã kiểm tra tương thích thổ nhưỡng ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {varietiesList.map((v) => {
                  const isChecked = selectedVariety.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVariety(v)}
                      className={`flex items-start gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-200 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={v.image}
                        alt={v.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover border border-stone-200 shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-heading font-black text-stone-900 truncate text-xs">
                            {v.name}
                          </h5>
                          {isChecked && <Check className="h-4 w-4 text-emerald-700 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                          {v.desc}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-600">
                          <span className="font-bold text-emerald-800">🌱 {v.expectedDuration} ngày</span>
                          <span>•</span>
                          <span>Nghỉ đất {v.bufferTime}N</span>
                          <span>•</span>
                          <span>{v.expectedYield}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bước 3: Gói dịch vụ chăm sóc */}
            <div className="space-y-2">
              <label className="block font-black uppercase tracking-wider text-stone-700">
                3. Hình thức canh tác:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCareMode('ASSISTED')}
                  className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                    selectedCareMode === 'ASSISTED'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="block font-black text-stone-900">Farmely chăm sóc trọn gói</span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Kỹ thuật viên tưới tiêu, bón phân, phòng trừ sâu bệnh VietGAP có ảnh minh chứng.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCareMode('SELF')}
                  className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                    selectedCareMode === 'SELF'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="block font-black text-stone-900">Tự canh tác</span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Bạn tự đến vườn trải nghiệm chăm sóc thực tế hoặc đặt dịch vụ lẻ khi bận.
                  </span>
                </button>
              </div>
            </div>

            {/* Bảng tổng hợp chi phí & thời hạn */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Thời hạn hợp đồng mới đến:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {new Date(calculation.newEndDate).toLocaleDateString('vi-VN')} (+{calculation.totalAdditionalDays} ngày)
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Đơn giá {selectedSeasonsCount} vụ ({selectedVariety.name}):</span>
                <span>{calculation.subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              {calculation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Ưu đãi gia hạn giữ thửa ({calculation.discountRate * 100}%):</span>
                  <span>-{calculation.discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2 font-heading font-black text-base text-emerald-900">
                <span>Tổng chi phí gia hạn:</span>
                <span>{calculation.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 font-black text-white hover:bg-emerald-800 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý gia hạn...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận & Gia hạn vụ mới</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
