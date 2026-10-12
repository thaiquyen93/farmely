import React, { useState } from 'react';
import {
  Calendar,
  Droplets,
  Thermometer,
  AlertTriangle,
  ShieldCheck,
  Sun,
  Activity,
  Wrench
} from 'lucide-react';

export default function SelfGrowingDashboard({ plot }) {
  const [completedSteps, setCompletedSteps] = useState([0, 1]);

  const toggleStep = (idx) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const soilMoistureNum = parseInt(plot.soilMoisture) || 62;
  const isMoistureLow = soilMoistureNum < 40;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. THÔNG SỐ VI KHÍ HẬU IOT */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-green" />
            <h4 className="font-heading font-black text-sm text-brand-dark">
              Vi Khí Hậu IoT • Trạm {plot.stationId}
            </h4>
          </div>
          {isMoistureLow ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Độ ẩm đất thấp ({plot.soilMoisture})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Độ ẩm đất tối ưu ({plot.soilMoisture})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[11px] text-stone-500 font-medium flex items-center justify-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Nhiệt độ
            </span>
            <div className="text-lg font-black text-brand-dark mt-0.5">{plot.temp}</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[11px] text-stone-500 font-medium flex items-center justify-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> Độ ẩm đất
            </span>
            <div className="text-lg font-black text-emerald-600 mt-0.5">{plot.soilMoisture}</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[11px] text-stone-500 font-medium flex items-center justify-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-500" /> Độ ẩm khí
            </span>
            <div className="text-lg font-black text-brand-dark mt-0.5">{plot.airHumidity}</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[11px] text-stone-500 font-medium flex items-center justify-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> Cường độ sáng
            </span>
            <div className="text-lg font-black text-brand-dark mt-0.5">{plot.light}</div>
          </div>
        </div>
      </div>

      {/* 2. QUY TRÌNH VIETGAP THAM KHẢO */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-green" />
            <h4 className="font-heading font-black text-sm text-brand-dark">
              Quy Trình VietGAP Tham Khảo (Ngày {plot.currentDay}/{plot.totalDays})
            </h4>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            Giai đoạn: <strong className="text-brand-dark">{plot.stage}</strong>
          </span>
        </div>

        <div className="space-y-2">
          {[
            { day: '01–07', title: 'Gieo hạt mầm & giữ ẩm 70–80%' },
            { day: '08–15', title: 'Tỉa định cây yếu, duy trì khoảng cách 15cm' },
            { day: '16–26', title: 'Xới thoáng luống & kiểm tra sâu bệnh' },
            { day: '27–35', title: 'Thu hoạch sáng sớm & đóng gói' }
          ].map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDone ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-brand-green focus:ring-brand-green cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-400 mr-2">Ngày {step.day}</span>
                    <span className={`text-xs font-bold ${isDone ? 'text-emerald-900 line-through' : 'text-brand-dark'}`}>
                      {step.title}
                    </span>
                  </div>
                </div>
                {isDone && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Hoàn tất
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DỊCH VỤ PHÁT SINH */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-green" />
            <h4 className="font-heading font-black text-sm text-brand-dark">Dịch Vụ Phát Sinh (À-la-carte)</h4>
          </div>
          <span className="text-[11px] text-stone-400">Đặt theo nhu cầu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                <span>Tưới nước khẩn cấp</span>
                <span className="text-emerald-700">30.000 đ</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Tưới đủ định mức khi đất khô.</p>
            </div>
            <button className="w-full py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer transition-colors">
              Đặt dịch vụ
            </button>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                <span>Nhổ cỏ & xới đất</span>
                <span className="text-emerald-700">50.000 đ</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Làm sạch cỏ dại rãnh luống.</p>
            </div>
            <button className="w-full py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer transition-colors">
              Đặt dịch vụ
            </button>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                <span>Ủy thác 30 ngày</span>
                <span className="text-emerald-700">650.000 đ</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Chuyển sang công nhân chăm sóc.</p>
            </div>
            <button className="w-full py-1.5 rounded-lg bg-brand-green hover:bg-brand-dark text-white text-xs font-bold cursor-pointer transition-colors">
              Chuyển gói
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
