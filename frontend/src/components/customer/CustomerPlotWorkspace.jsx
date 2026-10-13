import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight, Camera, Check, ChevronDown, ChevronRight, Clock3, CloudRain,
  CloudSun, Droplets, Leaf, MapPin, ShoppingBag, Sparkles, Sprout, Sun, Thermometer, Wind
} from 'lucide-react';

const metricMeta = [
  { key: 'temp', label: 'Nhiệt độ', icon: Thermometer, tone: 'bg-orange-50 text-orange-600', trend: '+0.8°' },
  { key: 'soilMoisture', label: 'Ẩm đất', icon: Droplets, tone: 'bg-sky-50 text-sky-600', trend: 'Tối ưu' },
  { key: 'airHumidity', label: 'Ẩm không khí', icon: Wind, tone: 'bg-cyan-50 text-cyan-600', trend: '-2%' },
  { key: 'light', label: 'Ánh sáng', icon: Sun, tone: 'bg-amber-50 text-amber-600', trend: 'Tốt' }
];

export default function CustomerPlotWorkspace({ plot, plots, operations, services = [], harvestPlan = null, onSelectPlot, onNavigate, onOpenAiChat, onOpenIotDetail, onOpenTask, onSelectService, onOpenHarvest }) {
  const [plotPickerOpen, setPlotPickerOpen] = useState(false);
  const isSelfGrowing = plot.mode === 'Self-Growing';
  const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);
  const harvestPlanDate = harvestPlan?.date ? harvestPlan.date.split('-').reverse().join('/') : '';
  const metrics = useMemo(() => metricMeta.map((item) => ({ ...item, value: plot[item.key] })), [plot]);

  return (
    <section className="min-h-[calc(100dvh-5rem)] bg-[#f5f7f2] px-4 pb-12 pt-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Nông trại đang trực tuyến</div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-[#18352b] sm:text-4xl">Chào buổi sáng, Quyền <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 text-sm text-stone-500">Khu vườn của bạn đang phát triển tốt. Đây là những điều đáng chú ý hôm nay.</p>
          </div>
          <button type="button" onClick={onOpenAiChat} className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Sparkles className="h-4 w-4 text-emerald-500" /> Hỏi Farmely AI</button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.75fr)]">
          <div className="space-y-5">
            <article className="group relative min-h-[430px] overflow-hidden rounded-[28px] bg-[#16382e] shadow-[0_22px_70px_-35px_rgba(18,55,43,.7)]">
              <img src={plot.image} alt={plot.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#102d25]/95 via-[#153a2d]/72 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/5" />
              <div className="relative flex min-h-[430px] flex-col justify-between p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <button type="button" onClick={() => setPlotPickerOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-md"><span className="h-2 w-2 rounded-full bg-lime-300" />{plot.name}<ChevronDown className="h-3.5 w-3.5" /></button>
                    {plotPickerOpen && <div className="absolute left-0 top-12 z-20 w-64 rounded-2xl bg-white p-2 shadow-2xl">{plots.map((item) => <button key={item.id} type="button" onClick={() => { onSelectPlot(item.id); setPlotPickerOpen(false); }} className={`w-full rounded-xl p-3 text-left ${item.id === plot.id ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}><span className="block text-xs font-black text-[#18352b]">{item.name}</span><span className="mt-1 block truncate text-[10px] text-stone-500">{item.crop}</span></button>)}</div>}
                  </div>
                  <div className="w-[220px] rounded-2xl border border-white/20 bg-black/35 p-3 text-white shadow-lg backdrop-blur-md">
                    <div className="flex items-start gap-2"><CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-white/60">Cảnh báo IoT</p><p className="mt-0.5 truncate text-xs font-black">Có thể mưa sau 45 phút</p></div></div>
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/70"><span>Gió 28 km/h · UV cao</span><button type="button" onClick={onOpenIotDetail} className="font-black text-lime-300">Chi tiết →</button></div>
                  </div>
                </div>
                <div className="max-w-xl text-white">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold"><span className="rounded-full bg-lime-300 px-3 py-1 text-[#17372c]">{isSelfGrowing ? 'TỰ CANH TÁC' : 'FARMELY CHĂM SÓC'}</span><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{plot.id}</span></div>
                  <h2 className="font-heading text-3xl font-black leading-tight !text-white sm:text-4xl">{plot.crop}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/75"><MapPin className="h-3.5 w-3.5" />{plot.location} · {plot.area}</p>
                  <div className="mt-7 max-w-lg"><div className="mb-2 flex items-center justify-between text-xs font-bold"><span>Tiến độ mùa vụ</span><span>{plot.progressPercent}% · Ngày {plot.currentDay}/{plot.totalDays}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,.75)] transition-all duration-700" style={{ width: `${plot.progressPercent}%` }} /></div><div className="mt-2 flex items-center justify-between text-[11px] text-white/65"><span>{plot.stage}</span><span>Còn khoảng {daysLeft} ngày</span></div></div>
                </div>
                <div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75 backdrop-blur">IoT cập nhật 5 phút trước</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75 backdrop-blur">Không phát hiện sâu bệnh</span></div>
              </div>
            </article>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.key} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><Icon className="h-5 w-5" /></span><span className="rounded-full bg-stone-50 px-2 py-1 text-[9px] font-bold text-stone-500">{metric.trend}</span></div><p className="mt-4 text-[11px] font-semibold text-stone-500">{metric.label}</p><p className="mt-0.5 text-xl font-black text-[#18352b]">{metric.value}</p></div>; })}</div>

            <div className="rounded-[24px] border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Hoạt động gần đây</p><h3 className="mt-1 font-heading text-xl font-black text-[#18352b]">Nhật ký từ nông trại</h3></div><button type="button" onClick={() => onNavigate?.('diary')} className="flex items-center gap-1 text-xs font-black text-emerald-700">Xem tất cả <ArrowUpRight className="h-4 w-4" /></button></div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">{operations.diary.slice(0, 2).map((entry, index) => <div key={`${entry.time}-${entry.title}`} className="flex gap-3 rounded-2xl bg-[#f7f8f5] p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">{index === 0 ? <Leaf className="h-5 w-5" /> : <Camera className="h-5 w-5" />}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase text-stone-400">{entry.time}</p><p className="mt-1 truncate text-sm font-black text-[#18352b]">{entry.title}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{entry.note}</p></div></div>)}</div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">Lịch hôm nay</p><h3 className="mt-1 font-heading text-xl font-black text-[#18352b]">Việc cần làm</h3></div><span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black text-orange-700">{operations.tasks.length} công việc</span></div>
              <div className="mt-5 space-y-3">{operations.tasks.map((task) => { const done = task.status === 'COMPLETED'; return <button key={task.id} type="button" onClick={() => onOpenTask?.(task)} className="flex w-full items-start gap-3 rounded-2xl border border-stone-100 p-3.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-200 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className={`block text-xs font-black ${done ? 'text-stone-400 line-through' : 'text-[#18352b]'}`}>{task.title}</span><span className="mt-1.5 flex items-center gap-1 text-[10px] text-stone-400"><Clock3 className="h-3 w-3" />{task.time} · {task.owner}</span></span><span className={`mt-1 h-2 w-2 rounded-full ${done ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-stone-300'}`} /></button>; })}</div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[10px] font-semibold text-amber-800"><CloudSun className="h-4 w-4 shrink-0" />Thời tiết thuận lợi cho công việc tiếp theo</div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-[#dff36a] p-5 text-[#18352b] shadow-sm sm:p-6"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[18px] border-white/25" /><Sprout className="h-8 w-8" /><p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em]">Vụ mùa hiện tại</p><p className="mt-1 font-heading text-2xl font-black">{daysLeft > 0 ? `${daysLeft} ngày nữa` : 'Đã đến vụ'}</p><p className="mt-1 max-w-[260px] text-xs leading-relaxed text-[#315044]">Dự kiến {plot.expectedHarvestDate} · sản lượng {plot.expectedYield}.</p>{harvestPlan ? (<div className="relative mt-4 rounded-xl bg-white/60 p-3 text-xs"><p className="flex items-center gap-1.5 font-bold text-[#18352b]"><Check className="h-4 w-4 text-emerald-700" />Đã đăng ký thu hoạch {harvestPlanDate}</p><p className="mt-1 text-[#315044]">{harvestPlan.methodLabel} · <span className="font-semibold">Chờ kỹ sư xác nhận</span></p></div>) : (<p className="mt-1 max-w-[260px] text-xs text-[#315044]">Farmely sẽ nhắc bạn trước 3 ngày.</p>)}<button type="button" onClick={() => onOpenHarvest?.(plot)} className="relative mt-4 flex items-center gap-2 rounded-xl bg-[#18352b] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0f2a20]">{harvestPlan ? 'Xem / sửa kế hoạch' : 'Chuẩn bị thu hoạch'} <ChevronRight className="h-4 w-4" /></button></div>

            <div className="rounded-[24px] border border-stone-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShoppingBag className="h-4 w-4" /></span><div><p className="font-heading text-sm font-black text-[#18352b]">Thuê dịch vụ</p><p className="text-[10px] text-stone-500">Đặt hỗ trợ riêng cho thửa này</p></div></div><button type="button" onClick={() => onNavigate?.('services')} className="text-[10px] font-black text-emerald-700">Xem tất cả</button></div>
              <div className="mt-3 space-y-2">
                {services.slice(0, 2).map((service) => (
                  <button key={service.id} type="button" onClick={() => onSelectService?.(service)} className="flex w-full items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/70 p-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-[#18352b]">{service.name}</span><span className="mt-0.5 block text-[10px] font-bold text-emerald-700">{service.formattedPrice}</span></span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                  </button>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </section>
  );
}
