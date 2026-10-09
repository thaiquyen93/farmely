import React, { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Crosshair, Expand, Map, MousePointer2, RotateCcw, Save, Undo2, X } from 'lucide-react';
import LandMap from '../../components/public/LandMap';
import { landsData } from '../../data/lands';
import { plotsData } from '../../data/plots';
import { getLandPolygons, saveLandPolygon } from '../../data/landMaps';

const statusLabel = {
  AVAILABLE: 'Có thể thuê',
  RENTED: 'Đã thuê',
  RESERVED: 'Giữ chỗ',
  MAINTENANCE: 'Nghỉ đất',
};

export default function LandMapEditor() {
  const { id } = useParams();
  const land = landsData.find(item => item.id === id);
  const plots = plotsData.filter(plot => plot.landId === id);
  const mapRef = useRef(null);
  const [selectedId, setSelectedId] = useState(plots[0]?.id);
  const [polygons, setPolygons] = useState(() => getLandPolygons(id));
  const [draft, setDraft] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [notice, setNotice] = useState('');
  const [savedId, setSavedId] = useState('');

  if (!land) return <p>Không tìm thấy khu đất. <Link to="/admin/master-data/lands">Quay lại</Link></p>;

  const choosePlot = plot => {
    setSelectedId(plot.id);
    setDrawing(false);
    setDraft([]);
    setNotice('');
  };
  const addPoint = useCallback(point => {
    setDraft(current => [...current, point]);
    setNotice('');
  }, []);
  const startDrawing = () => {
    setDraft([]);
    setDrawing(true);
    setSavedId('');
    setNotice('Bấm lần lượt quanh mép thửa đất. Có thể zoom hoặc kéo bản đồ trước khi đặt điểm tiếp theo.');
  };
  const cancelDrawing = () => {
    setDraft([]);
    setDrawing(false);
    setNotice('Đã hủy vùng đang vẽ.');
  };
  const save = () => {
    const points = drawing ? draft : mapRef.current?.getSelectedPath();
    if (!points || points.length < 3) {
      setNotice('Cần ít nhất 3 điểm để tạo ranh giới plot.');
      return;
    }
    saveLandPolygon(id, selectedId, points);
    setPolygons(current => ({ ...current, [selectedId]: points }));
    setDraft([]);
    setDrawing(false);
    setSavedId(selectedId);
    setNotice('Đã lưu ranh plot theo đúng ảnh vệ tinh. Marketplace sẽ dùng vùng này ở mọi mức zoom.');
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link to={`/admin/master-data/lands/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><ArrowLeft size={16} /> Quay lại khu đất</Link>
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />Bản đồ demo chạy offline</span>
    </div>

    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Quy hoạch trên ảnh vệ tinh</p>
      <h2 className="font-heading text-2xl font-black text-brand-dark">Chỉnh ranh plot · {land.name}</h2>
      <p className="mt-1 max-w-4xl text-sm text-brand-muted">Phóng to tới mép luống bằng nút +, nhấp đúp hoặc Ctrl + cuộn; cuộn bình thường vẫn dùng để di chuyển trang. Chọn plot rồi kéo các điểm hiện có hoặc vẽ lại.</p>
    </div>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <LandMap
        ref={mapRef}
        land={land}
        plots={plots}
        polygons={polygons}
        selectedId={selectedId}
        onSelect={choosePlot}
        editable
        drawing={drawing}
        draft={draft}
        onMapPoint={addPoint}
        heightClass="h-[72vh] min-h-[640px]"
      />

      <aside className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
        <div className="border-b border-brand-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Plot đang chỉnh</p><p className="font-heading text-xl font-black text-brand-dark">{plots.find(plot => plot.id === selectedId)?.code}</p></div>
            <button type="button" onClick={() => mapRef.current?.recenter()} className="rounded-xl border border-brand-border p-2 text-brand-green" title="Về khu đất"><Crosshair size={18} /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={startDrawing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green px-3 py-2.5 text-sm font-bold text-brand-green"><MousePointer2 size={16} /> Vẽ lại</button>
            <button type="button" onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-3 py-2.5 text-sm font-bold text-white"><Save size={16} /> Lưu vùng</button>
          </div>
          <button type="button" onClick={() => mapRef.current?.enterFullscreen()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cream px-3 py-2.5 text-sm font-bold text-brand-dark"><Expand size={16} /> Mở bản đồ toàn màn hình</button>
          {drawing && <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setDraft(current => current.slice(0, -1))} disabled={!draft.length} className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-cream px-3 py-2 text-xs font-bold disabled:opacity-40"><Undo2 size={14} /> Hoàn tác</button><button type="button" onClick={cancelDrawing} className="inline-flex items-center justify-center gap-1 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold"><X size={14} /> Hủy vẽ</button></div>}
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${notice.includes('Cần') ? 'bg-rose-50 text-rose-800' : 'bg-brand-cream text-brand-muted'}`}>{notice || (drawing ? `Đã đặt ${draft.length} điểm.` : 'Kéo các nút trắng để chỉnh vùng hiện có, sau đó bấm Lưu vùng.')}</p>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {plots.map(plot => {
            const active = plot.id === selectedId;
            return <button key={plot.id} type="button" onClick={() => choosePlot(plot)} className={`mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${active ? 'bg-brand-dark text-white' : 'hover:bg-brand-cream'}`}>
              <span><strong className="block text-sm">{plot.code} · {plot.name}</strong><small className={active ? 'text-white/70' : 'text-brand-muted'}>{statusLabel[plot.status] || plot.status}</small></span>
              {savedId === plot.id ? <Check size={17} className="text-brand-yellow" /> : polygons[plot.id]?.length ? <Map size={16} className={active ? 'text-brand-yellow' : 'text-brand-green'} /> : <RotateCcw size={15} className="text-stone-400" />}
            </button>;
          })}
        </div>
      </aside>
    </div>
  </div>;
}
