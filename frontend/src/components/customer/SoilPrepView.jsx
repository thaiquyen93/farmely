import React from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Sprout,
  ShieldCheck,
  Camera,
  ArrowRight,
  RotateCcw,
  FileText,
  UserCheck,
  Check,
  Layers,
  Sun,
  Droplets,
  Activity
} from 'lucide-react';
import { FALLOW_PROTOCOL_STEPS } from '../../services/cropStandardProcess';

/**
 * Component hiển thị Minh chứng Cải tạo đất & Nghỉ đất chuẩn VietGAP (BR23 - 4 Ngày).
 * Thay thế checklist SOP nội bộ phức tạp bằng thẻ minh chứng thực địa trực quan,
 * minh bạch chỉ số thổ nhưỡng và thành quả vụ mùa vừa kết thúc cho Khách hàng.
 */
export default function SoilPrepView({
  plot = {},
  season = {},
  nextSeason,
  onOpenRenewal,
  onChangeCrop,
  latestHarvest,
  onOpenHarvestReport,
  onSimulateDay1
}) {
  const plotCode = plot.plotCode || plot.mapPlotId || plot.key || 'P-12';
  const cropName = season.cropName || plot.crop || 'Dưa leo baby F1';
  const yieldKg = latestHarvest?.yieldKg || '18.50';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BANNER TRẠNG THÁI: BẢO TRÌ & PHƠI ẢI ĐẤT (BR23) */}
      <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/50 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
              <Sparkles className="h-6 w-6 text-amber-100 animate-pulse" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black text-amber-900 border border-amber-300">
                  🌿 Chuẩn VietGAP · Bảo trì & Nghỉ đất 04 Ngày (BR23)
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-extrabold text-stone-700">
                  Thửa {plotCode}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-black text-stone-900 sm:text-2xl tracking-tight">
                Đang Cải Tạo & Phơi Ải Phục Hồi Độ Phì Nhiêu Đất
              </h2>
              <p className="mt-1.5 text-xs text-stone-600 max-w-2xl leading-relaxed">
                Sau khi thu hoạch xong vụ mùa, theo quy định <strong>Business Rule BR23</strong> và quy trình chuẩn VietGAP, thửa đất chuyển sang trạng thái <strong>Bảo trì (Maintenance) trong 4 ngày</strong> để vệ sinh gốc rễ, rải vôi bột khử trùng, cày lật sâu 25cm và phơi ải nắng tự nhiên nhằm triệt tiêu mầm nấm tuyến trùng, phục hồi dinh dưỡng hữu cơ trước khi bàn giao vụ tiếp theo.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 border-t border-amber-100 pt-3 sm:border-t-0 sm:pt-0">
            <div className="rounded-2xl bg-amber-100/90 px-4 py-2.5 text-right border border-amber-300 shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Tiến độ bảo trì đất
              </span>
              <span className="font-heading text-lg font-black text-amber-950">
                Ngày 3 / 4 Ngày
              </span>
              <span className="block text-[10px] text-amber-800 font-medium">
                Còn 1 ngày · Sắp vào vụ mới
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THÀNH QUẢ VỤ MÙA VỪA KẾT THÚC (BIÊN BẢN NGHIỆM THU NHANH BR20 & BR21) */}
      <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-white to-stone-50 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-100" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 border border-emerald-200">
                  ✓ Đã nghiệm thu vụ mùa
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-bold text-stone-700">
                  {cropName}
                </span>
              </div>
              <h3 className="mt-1 font-heading text-base font-black text-stone-900">
                Vụ mùa đã thu hoạch thành công · Đạt sản lượng {yieldKg} kg
              </h3>
              <p className="mt-0.5 text-xs text-stone-600">
                Ký nhận bởi <strong>Trần Văn Lực (staff_id = 8)</strong> qua cân điện tử (BR20). Bàn giao nông sản sạch trực tiếp tại nông trại theo hình thức <strong>PICKUP (BR21)</strong>.
              </p>
            </div>
          </div>

          {onOpenHarvestReport && (
            <button
              type="button"
              onClick={() => onOpenHarvestReport(latestHarvest)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4 text-emerald-700" />
              <span>Xem Biên bản thu hoạch</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. KHỐI MINH CHỨNG THỰC ĐỊA & CHỈ SỐ THỔ NHƯỠNG HIỆN TRƯỜNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI (7 PHẦN): ẢNH MINH CHỨNG HIỆN TRƯỜNG TẠI LUỐNG */}
        <div className="lg:col-span-7 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-heading font-black text-base text-stone-900 flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-700" />
                Minh Chứng Hiện Trường Đang Cải Tạo
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Ảnh chụp thực tế luống đất đang phơi ải và khử trùng do nhân viên hiện trường cập nhật.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              ● Trực tiếp từ luống đất
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner group">
            <img
              src="/images/Mucangchai3.jpg"
              alt="Luống đất đang được cày xới và phơi ải phục hồi"
              className="h-56 sm:h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-between p-4">
              <span className="self-start rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                📷 Luống đất Thửa {plotCode} · Phơi ải ngày thứ 3
              </span>
              <div className="text-white space-y-1">
                <p className="text-xs font-semibold leading-relaxed drop-shadow-sm">
                  Đã hoàn tất dọn dẹp gốc rễ vụ cũ, rải 20kg vôi bột nông nghiệp/100m² hạ phèn và cày lật sâu 25cm phơi ải dưới nắng tự nhiên.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Kỹ thuật viên thực hiện: Trần Văn Lực (CVLĐ)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Chứng thực quy trình: <strong>Đạt chuẩn phục hồi đất VietGAP</strong></span>
            </div>
            <span className="font-mono text-[11px] font-bold text-stone-500">
              Mã kiểm định: #SOIL-BR23-{plotCode}
            </span>
          </div>
        </div>

        {/* CỘT PHẢI (5 PHẦN): BẢNG CHỈ SỐ THỔ NHƯỠNG KIỂM ĐỊNH */}
        <div className="lg:col-span-5 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-heading font-black text-base text-stone-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-700" />
                Chỉ Số Đất Phục Hồi Thực Địa
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Dữ liệu đo đạc thực tế sau khi xử lý vôi nông nghiệp và phơi ải.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {/* Chỉ số 1: pH */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Độ pH Đất
                </span>
                <div className="font-heading text-xl font-black text-emerald-950">
                  6.4 pH
                </div>
                <p className="text-[10px] text-emerald-700 leading-tight">
                  Tối ưu (VietGAP 6.0 - 6.8) sau khi rải vôi hạ phèn.
                </p>
              </div>

              {/* Chỉ số 2: Độ ẩm đất phơi */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Độ Ẩm Tầng Đất
                </span>
                <div className="font-heading text-xl font-black text-amber-950">
                  42%
                </div>
                <p className="text-[10px] text-amber-700 leading-tight">
                  Đang ráo ải diệt nấm hại & tuyến trùng tự nhiên.
                </p>
              </div>

              {/* Chỉ số 3: Độ sâu xới lật */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  Độ Sâu Cày Lật
                </span>
                <div className="font-heading text-xl font-black text-stone-900">
                  25 cm
                </div>
                <p className="text-[10px] text-stone-500 leading-tight">
                  Đạt chuẩn tơi xốp, làm giàu oxy hóa tầng đất rễ.
                </p>
              </div>

              {/* Chỉ số 4: Hệ vi sinh đối kháng */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  Vi Sinh Đối Kháng
                </span>
                <div className="font-heading text-xl font-black text-sky-950">
                  Trichoderma
                </div>
                <p className="text-[10px] text-sky-700 leading-tight">
                  Đã ủ phân hữu cơ trùn quế sẵn sàng cho vụ tới.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>Cam kết VietGAP:</strong> Đất được nghỉ trọn vẹn 4 ngày để đảm bảo không tồn dư sâu bệnh giữa 2 hợp đồng, giúp vụ gieo trồng tiếp theo đạt năng suất cao nhất.
          </div>
        </div>
      </div>

      {/* 4. LỘ TRÌNH 4 BƯỚC BẢO TRÌ & NGHỈ ĐẤT CHUẨN VIETGAP (BR23 STEPPER) */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="font-heading font-black text-base text-stone-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            Lộ Trình 4 Ngày Bảo Trì & Nghỉ Đất (Quy Định BR23)
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Tiến độ 4 ngày phục hồi độ phì đất thực địa giữa 2 vụ canh tác.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FALLOW_PROTOCOL_STEPS.map((step) => {
            const isDone = step.status === 'COMPLETED';
            const isDoing = step.status === 'IN_PROGRESS';

            return (
              <div
                key={step.step}
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : isDoing
                    ? 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-100 shadow-xs'
                    : 'border-stone-200/80 bg-stone-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs ${
                        isDone
                          ? 'bg-emerald-700 text-white'
                          : isDoing
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : step.step}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDoing
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isDone ? '✓ Đã xong' : isDoing ? '⚡ Đang làm' : '⏳ Kế tiếp'}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-xs text-stone-900 leading-snug">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-stone-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500 font-medium">
                  <span>⏱ {step.duration}</span>
                  <span>{step.worker?.split(' ')[0]} {step.worker?.split(' ')[1] || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. KHỐI HÀNH ĐỘNG KHÁCH HÀNG & PHÍM TẮT DEMO NHANH */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Sprout className="h-6 w-6 text-emerald-700" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Kế hoạch canh tác tiếp theo
            </span>
            <h4 className="font-heading font-black text-base text-stone-900">
              {nextSeason ? nextSeason.cropName : 'Sẵn sàng đăng ký vụ mùa tiếp theo'}
            </h4>
            <p className="text-xs text-stone-500">
              {nextSeason
                ? `Thời gian dự kiến: ${nextSeason.totalDays || 45} ngày sinh trưởng · Thời gian nghỉ đất: 4 ngày.`
                : 'Bấm "Gia hạn thêm vụ mới" để tiếp tục canh tác hoặc bấm "Bắt đầu lại (Ngày 1)" để chạy lại kịch bản demo.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
          {onSimulateDay1 && (
            <button
              type="button"
              onClick={onSimulateDay1}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 px-3.5 py-2.5 text-xs font-bold text-stone-700 transition cursor-pointer"
              title="Quay trở lại Ngày 1 bắt đầu vụ để tiếp tục chạy kịch bản demo"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-600" />
              <span>🌱 Bắt đầu lại (Ngày 1)</span>
            </button>
          )}

          {onChangeCrop && (
            <button
              type="button"
              onClick={onChangeCrop}
              className="rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Đổi giống cây
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRenewal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800 shadow-sm transition cursor-pointer"
          >
            <span>Gia hạn vụ mới</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
