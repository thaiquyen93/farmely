import React from 'react';
import {
  Sprout,
  CheckCircle2,
  Clock,
  Camera,
  MessageSquare,
  Apple,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import Button from '../common/Button';

export default function AssistedGrowingDashboard({ plot, onOpenExpertChat, onOpenHarvestModal }) {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. TIẾN ĐỘ SINH TRƯỞNG VIETGAP */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <h4 className="font-heading font-black text-sm text-brand-dark">
              Tiến Độ Sinh Trưởng VietGAP • Ngày {plot.currentDay}/{plot.totalDays}
            </h4>
          </div>
          <span className="text-sm font-black text-brand-green">{plot.progressPercent}%</span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-500"
              style={{ width: `${plot.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-stone-400">
            <span>Gieo mầm</span>
            <span className="text-brand-dark font-semibold">Hiện tại: {plot.stage}</span>
            <span>Thu hoạch ({plot.expectedHarvestDate})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-800 font-bold block">GĐ 1: Gieo khay</span>
            <span className="text-xs font-bold text-emerald-900">Hoàn tất</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-800 font-bold block">GĐ 2: Xuống luống</span>
            <span className="text-xs font-bold text-emerald-900">Hoàn tất</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[10px] text-amber-800 font-bold block">GĐ 3: Nuôi thân</span>
            <span className="text-xs font-bold text-amber-900">Đang thực hiện</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[10px] text-stone-500 font-bold block">GĐ 4: Thu hoạch</span>
            <span className="text-xs font-bold text-stone-600">{plot.expectedHarvestDate}</span>
          </div>
        </div>
      </div>

      {/* 2. NHẬT KÝ CA TRỰC CÔNG NHÂN */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
            <h4 className="font-heading font-black text-sm text-brand-dark">Nhật Ký Ca Trực Công Nhân</h4>
          </div>
          <span className="text-xs text-stone-500">
            Phụ trách: <strong className="text-brand-dark">{plot.worker}</strong>
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            {
              id: 'T1',
              time: 'Hôm nay · 06:30',
              title: 'Tưới ẩm định mức 12L/m² & Tỉa lá gốc',
              worker: plot.worker,
              photos: ['/images/Mucangchai3.jpg', '/images/moc-chau-2811.jpg']
            },
            {
              id: 'T2',
              time: 'Hôm qua · 16:15',
              title: 'Bón thúc phân trùn quế hữu cơ vi sinh',
              worker: plot.worker,
              photos: ['/images/mu-cang-chai-thang-8-2-1006.webp']
            },
            {
              id: 'T3',
              time: '02 ngày trước · 07:00',
              title: 'Phun chế phẩm thảo mộc sinh học xua đuổi sâu tơ',
              worker: plot.worker,
              photos: ['/images/happy_valley_aerial.jpg']
            }
          ].map((task) => (
            <div key={task.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-brand-dark">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{task.title}</span>
                </div>
                <span className="text-stone-400 text-[11px]">{task.time}</span>
              </div>
              <div className="flex items-center gap-2 pl-5">
                {task.photos.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Minh chứng"
                    className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                  />
                ))}
                <span className="text-[11px] text-stone-400">
                  {task.photos.length} ảnh thực địa
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TƯ VẤN CHUYÊN GIA & NGHIỆM THU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Chat Chuyên gia */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-brand-dark">Tư Vấn Chuyên Gia (CGNN)</div>
              <div className="text-[11px] text-stone-500">Kỹ sư Nguyễn Hoàng Lâm</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExpertChat}
            className="text-xs font-bold cursor-pointer"
          >
            Nhắn tin
          </Button>
        </div>

        {/* Nghiệm thu thu hoạch */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-brand-dark">Nghiệm Thu Thu Hoạch</div>
              <div className="text-[11px] text-stone-500">Ước tính {plot.expectedYield}</div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenHarvestModal}
            className="text-xs font-bold cursor-pointer"
          >
            Đăng ký nhận
          </Button>
        </div>
      </div>
    </div>
  );
}
