import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowRight, CalendarDays, Ruler, Sprout } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import LandMap from '../../components/public/LandMap';
import { plotsData } from '../../data/plots';
import { landsData } from '../../data/lands';
import { getLandPolygons, LAND_POLYGONS_CHANGED_EVENT, mapCenters } from '../../data/landMaps';

const statusLabel = {
  AVAILABLE: 'Có thể thuê',
  RENTED: 'Đã được thuê',
  RESERVED: 'Đang giữ chỗ',
  MAINTENANCE: 'Đang nghỉ đất',
};

export default function Marketplace({ embedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLand = searchParams.get('landId');
  const landId = landsData.some(land => land.id === requestedLand) ? requestedLand : landsData[0].id;
  const land = landsData.find(item => item.id === landId);
  const plots = useMemo(() => plotsData.filter(plot => plot.landId === land.id), [land.id]);
  const [selectedId, setSelectedId] = useState(plots[0]?.id);
  const [polygons, setPolygons] = useState(() => getLandPolygons(land.id));
  useEffect(() => { setSelectedId(plots.find(plot => plot.status === 'AVAILABLE')?.id || plots[0]?.id); }, [landId]);
  useEffect(() => {
    const refreshPolygons = event => {
      if (event?.detail?.landId && event.detail.landId !== land.id) return;
      setPolygons(getLandPolygons(land.id));
    };
    refreshPolygons();
    window.addEventListener(LAND_POLYGONS_CHANGED_EVENT, refreshPolygons);
    window.addEventListener('storage', refreshPolygons);
    window.addEventListener('focus', refreshPolygons);
    return () => {
      window.removeEventListener(LAND_POLYGONS_CHANGED_EVENT, refreshPolygons);
      window.removeEventListener('storage', refreshPolygons);
      window.removeEventListener('focus', refreshPolygons);
    };
  }, [land.id]);
  const selected = plots.find(plot => plot.id === selectedId) || plots[0];
  const available = plots.filter(plot => plot.status === 'AVAILABLE').length;

  const content = <>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-green">Khám phá khu đất</p>
        <h1 className="font-heading text-3xl font-black text-brand-dark sm:text-4xl">Chọn thửa đất trên bản đồ</h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-muted">Chọn một khu đất, sau đó nhấn vào từng plot để xem diện tích, tình trạng và giá thuê.</p>
      </div>
      <label className="text-xs font-semibold text-brand-dark">Khu đất
        <select className="mt-1 block min-w-64 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" value={land.id} onChange={event => setSearchParams(embedded ? { tab: 'marketplace', landId: event.target.value } : { landId: event.target.value })}>
          {landsData.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
    </div>

    <div className="mb-5 rounded-2xl border border-brand-border bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <h2 className="font-heading text-lg font-black text-brand-dark">{land.name}</h2>
        <span className="inline-flex items-center gap-1.5 text-brand-muted"><MapPin size={15} />{land.location}</span>
        <span className="inline-flex items-center gap-1.5 text-brand-muted"><Ruler size={15} />{land.totalArea}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{available}/{plots.length} plot có thể thuê</span>
      </div>
    </div>

    <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-brand-muted">
      <span><i className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-emerald-700 bg-emerald-600/30" />Có thể thuê</span>
      <span><i className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-red-700" />Đã thuê</span>
      <span><i className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-amber-600" />Giữ chỗ</span>
      <span><i className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-slate-500" />Nghỉ đất</span>
    </div>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <LandMap land={land} plots={plots} polygons={polygons} selectedId={selected?.id} onSelect={plot => setSelectedId(plot.id)} heightClass="h-[520px] lg:h-[640px]" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Danh sách plot">{plots.map(plot => <button key={plot.id} type="button" onClick={() => setSelectedId(plot.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${selected?.id === plot.id ? 'bg-brand-dark text-white' : 'bg-white text-brand-dark'}`}>{plot.code} · {statusLabel[plot.status]}</button>)}</div>
      </div>
      <aside className="rounded-2xl border-2 border-brand-yellow bg-white p-5 shadow-[0_16px_40px_rgba(23,55,38,.16)]" aria-live="polite">
        {selected ? <>
          <div className="flex items-center justify-between gap-2 border-b border-brand-border pb-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Thửa đang chọn</p><h2 className="font-heading text-3xl font-black text-brand-dark">{selected.code}</h2></div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${selected.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>{statusLabel[selected.status] || 'Chưa mở'}</span>
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-brand-dark">{selected.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">{selected.description}</p>
          <dl className="mt-5 space-y-3 border-y border-brand-border py-4 text-sm">
            <div className="flex justify-between gap-3"><dt>Diện tích</dt><dd className="font-bold text-brand-dark">{selected.area}</dd></div>
            <div className="flex justify-between gap-3"><dt>Giá thuê</dt><dd className="font-bold text-brand-green">{selected.formattedPrice}</dd></div>
            <div className="flex justify-between gap-3"><dt>Đất trồng</dt><dd className="max-w-40 text-right text-brand-dark">{selected.soilType}</dd></div>
          </dl>
          {selected.isDemo && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Thông tin và ranh giới plot mẫu, chờ quản trị viên xác nhận.</p>}
          <div className="mt-5 grid gap-2">
            <Link to={`/marketplace/plot/${selected.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark">Xem chi tiết plot <ArrowRight size={16} /></Link>
            <Link to={`/site-visit/book?plotId=${selected.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-3 text-sm font-bold text-brand-dark hover:bg-brand-cream"><CalendarDays size={16} /> Đặt lịch xem đất</Link>
          </div>
        </> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><Sprout className="mb-2 text-brand-green" /><p>Chọn một plot trên ảnh để xem thông tin.</p></div>}
      </aside>
    </div>
    <p className="mt-3 text-xs text-brand-muted">Ảnh vệ tinh của khu đất có thể kéo, phóng to và hiển thị ranh plot do quản trị viên lưu. <a className="font-bold text-brand-green underline" href={`https://www.google.com/maps?q=${encodeURIComponent(mapCenters[land.id])}`} target="_blank" rel="noopener noreferrer">Mở vị trí tham chiếu</a>.</p>
  </>;

  if (embedded) return <section className="w-full">{content}</section>;
  return <div className="min-h-screen bg-brand-cream"><PublicNavbar /><main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">{content}</main><Footer /></div>;
}
