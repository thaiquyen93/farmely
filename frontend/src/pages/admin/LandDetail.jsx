import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import BoundaryPreviewMap from '../../components/admin/BoundaryPreviewMap';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { formatArea } from '../../utils/polygonGeometry';
import { ArrowLeft, Check, Edit, Grid3X3, Loader2, MapPin, PenLine, Plus } from 'lucide-react';

const money = (v) => (v == null ? '—' : `${Number(v).toLocaleString('vi-VN')} đ`);

export default function LandDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash || '');
  const [selected, setSelected] = useState(location.state?.highlightPlotId ?? null);

  const load = useCallback(() => {
    setError('');
    farmApi.getLand(id).then(setLand).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!flash) return undefined;
    navigate(location.pathname, { replace: true, state: null }); // không hiện lại khi F5
    const t = setTimeout(() => setFlash(''), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Không tải được nông trại #{id}</p>
        <p className="mt-1">{error}</p>
        <button type="button" onClick={load} className="mt-3 font-semibold underline">Thử lại</button>
      </div>
    );
  }
  if (!land) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải nông trại…</div>;
  }

  const plots = land.plots || [];
  const drawn = plots.filter((p) => p.boundary?.length >= 3).length;

  return (
    <div className="space-y-6">
      {flash && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Check className="h-4 w-4" />{flash}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin/master-data/lands" className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-dark" aria-label="Quay lại">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="block font-mono text-[11px] uppercase text-brand-muted">LAND-{land.landId}</span>
            <h2 className="font-heading text-2xl font-black text-brand-dark">{land.landName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to={`/admin/master-data/lands/create?editId=${land.landId}`}><Button variant="outline" size="sm" icon={Edit}>Chỉnh sửa thông tin</Button></Link>
          <Link to={`/admin/master-data/plots/create?landId=${land.landId}`}><Button variant="primary" size="sm" icon={Plus}>Vẽ thửa đất mới</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <BoundaryPreviewMap land={land} plots={plots} highlightId={selected} onSelect={setSelected} height={420} />
          <p className="text-xs text-stone-500">Bấm vào một thửa trên bản đồ để làm nổi bật dòng tương ứng ở bảng bên dưới.</p>
        </div>
        <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <h3 className="font-heading text-base font-bold text-brand-dark">Thông tin khu đất</h3>
          <p className="flex items-start gap-1.5 text-sm text-stone-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />{land.address}</p>
          {land.description && <p className="text-sm leading-relaxed text-stone-600">{land.description}</p>}
          <dl className="grid grid-cols-2 gap-3 border-t border-brand-border/60 pt-4 text-xs">
            <div><dt className="text-[10px] font-bold uppercase text-brand-muted">Diện tích theo GPS</dt><dd className="mt-0.5 text-sm font-bold text-brand-dark">{land.boundaryAreaM2 ? formatArea(land.boundaryAreaM2) : 'Chưa nhập toạ độ'}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-brand-muted">Thửa đã vẽ</dt><dd className="mt-0.5 text-sm font-bold text-brand-dark">{drawn} / {plots.length}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-brand-muted">Đang trống</dt><dd className="mt-0.5 text-sm font-bold text-emerald-700">{land.availablePlots ?? 0}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-brand-muted">Đã thuê</dt><dd className="mt-0.5 text-sm font-bold text-amber-700">{land.rentedPlots ?? 0}</dd></div>
          </dl>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-brand-dark"><Grid3X3 className="h-5 w-5 text-brand-green" />Các thửa đất thuộc {land.landName}</h3>
          <span className="text-xs text-brand-muted">Tổng cộng: <strong>{plots.length}</strong> thửa</span>
        </div>
        {plots.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">Chưa có thửa nào. Bấm “Vẽ thửa đất mới” để khoanh thửa đầu tiên trên bản đồ.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>Mã thửa</th><th>Diện tích</th><th>Giá thuê / tháng</th><th>Ranh giới</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {plots.map((p) => (
                  <tr key={p.plotId} onClick={() => setSelected(p.plotId)} className={`cursor-pointer ${String(selected) === String(p.plotId) ? 'bg-emerald-50' : ''}`}>
                    <td className="font-mono font-bold text-brand-dark">{p.plotCode}</td>
                    <td>{formatArea(Number(p.area))}</td>
                    <td className="font-bold text-brand-green">{money(p.pricePerPeriod)}</td>
                    <td>{p.boundary?.length >= 3 ? <span className="text-xs font-semibold text-emerald-700">Đã vẽ · {p.boundary.length} góc</span> : <span className="text-xs text-stone-400">Chưa vẽ</span>}</td>
                    <td><Badge variant={plotStatusBadge(p.status)} size="sm">{plotStatusBadge(p.status)}</Badge></td>
                    <td>
                      <Link to={`/admin/master-data/plots/create?editId=${p.plotId}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-green hover:bg-stone-100">
                        <PenLine className="h-3.5 w-3.5" />{p.boundary?.length >= 3 ? 'Sửa' : 'Vẽ ranh giới'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
