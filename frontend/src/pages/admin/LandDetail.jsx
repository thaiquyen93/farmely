import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import BoundaryPreviewMap from '../../components/admin/BoundaryPreviewMap';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { cleanRing, formatArea } from '../../utils/polygonGeometry';
import { ArrowLeft, Check, Edit, Grid3X3, Loader2, MapPin, PenLine, Plus, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const money = (v) => (v == null ? '—' : `${Number(v).toLocaleString('vi-VN')} đ`);

export default function LandDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash || '');
  const [selected, setSelected] = useState(location.state?.highlightPlotId ?? null);
  const [togglingLand, setTogglingLand] = useState(false);
  const [togglingPlotId, setTogglingPlotId] = useState(null);

  const load = useCallback(() => {
    setError('');
    farmApi.getLand(id).then(setLand).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  const handleToggleLandPublish = async () => {
    if (!land) return;
    setTogglingLand(true);
    setActionError('');
    try {
      const nextPublished = !(Boolean(land.isPublished) && Number(land.publishedPlots) > 0);
      await farmApi.publishLand(land.landId, nextPublished);
      setFlash(
        nextPublished
          ? `Đã chuyển trạng thái kích hoạt nông trại "${land.landName}" và niêm yết lên Marketplace!`
          : `Đã gỡ niêm yết nông trại "${land.landName}" khỏi Marketplace.`
      );
      load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setTogglingLand(false);
    }
  };

  const handleTogglePlotPublish = async (plot, e) => {
    e.stopPropagation();
    setTogglingPlotId(plot.plotId);
    setActionError('');
    try {
      const nextPublished = !plot.isPublished;
      await farmApi.publishPlot(plot.plotId, nextPublished);
      setFlash(
        nextPublished
          ? `Đã duyệt & chuyển trạng thái thửa đất ${plot.plotCode} hiển thị lên Marketplace!`
          : `Đã gỡ niêm yết thửa đất ${plot.plotCode} khỏi Marketplace.`
      );
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTogglingPlotId(null);
    }
  };

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
  const drawn = plots.filter((p) => cleanRing(p.boundary).length >= 3).length;
  const configuredPlotsCount = Number(land.configuredPlots) || plots.filter((p) => Number(p.compatibleVarietiesCount) > 0).length;
  const publishedPlotsCount = Number(land.publishedPlots) || plots.filter((p) => p.isPublished).length;
  const isLandLive = Boolean(land.isPublished) && publishedPlotsCount > 0;

  return (
    <div className="space-y-6">
      {flash && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Check className="h-4 w-4" />{flash}
        </div>
      )}
      {actionError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{actionError}</span>
          <button type="button" onClick={() => setActionError('')} className="shrink-0 text-xs font-semibold underline">Đóng</button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin/master-data/lands" className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-dark" aria-label="Quay lại">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase text-brand-muted">LAND-{land.landId}</span>
              {isLandLive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVE · Đang hiện trên Marketplace
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  <Clock className="h-3.5 w-3.5" /> {configuredPlotsCount > 0 ? 'Chờ Admin kích hoạt lên sàn' : 'Chưa kích hoạt (Chờ Expert cấu hình)'}
                </span>
              )}
            </div>
            <h2 className="font-heading text-2xl font-black text-brand-dark">{land.landName}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={togglingLand}
            onClick={handleToggleLandPublish}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-sm transition cursor-pointer ${
              isLandLive
                ? 'border border-stone-300 bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                : 'bg-[#294C3B] text-white hover:bg-[#1f3a2d]'
            }`}
          >
            <Sparkles className="h-4 w-4 text-lime-300" />
            <span>{isLandLive ? 'TẠM ẨN KHỎI MARKETPLACE' : 'CHUYỂN TRẠNG THÁI: HIỆN LÊN MARKETPLACE'}</span>
          </button>
          <Link to={`/admin/master-data/lands/create?editId=${land.landId}`}><Button variant="outline" size="sm" icon={Edit}>Chỉnh sửa thông tin</Button></Link>
          <Link to={`/admin/master-data/plots/create?landId=${land.landId}`}><Button variant="primary" size="sm" icon={Plus}>Vẽ thửa đất mới</Button></Link>
        </div>
      </div>

      {/* Flow 1 Readiness Timeline Banner */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-xs sm:grid-cols-3">
        <div className={`flex items-start gap-3 rounded-xl border p-3 ${plots.length > 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${plots.length > 0 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>1</span>
          <div className="text-xs">
            <p className="font-bold text-brand-dark">Bước 1: Admin Tạo Đất & Định Giá</p>
            <p className="mt-0.5 text-stone-600">{plots.length > 0 ? `Đã tạo ${plots.length} thửa đất (mặc định chưa kích hoạt)` : 'Chưa có thửa đất nào'}</p>
          </div>
        </div>
        <div className={`flex items-start gap-3 rounded-xl border p-3 ${configuredPlotsCount > 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${configuredPlotsCount > 0 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>2</span>
          <div className="text-xs">
            <p className="font-bold text-brand-dark">Bước 2: Expert Gán Giống & Quy Trình</p>
            <p className="mt-0.5 text-stone-600">
              {configuredPlotsCount > 0
                ? `Expert đã cấu hình ${configuredPlotsCount}/${plots.length} thửa đất`
                : 'Chờ Chuyên gia gán giống cây (BR03) & quy trình (BR12)'}
            </p>
          </div>
        </div>
        <div className={`flex items-start gap-3 rounded-xl border p-3 ${isLandLive ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200 bg-stone-50'}`}>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${isLandLive ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'}`}>3</span>
          <div className="text-xs">
            <p className="font-bold text-brand-dark">Bước 3: Admin Kích Hoạt Lên Marketplace</p>
            <p className="mt-0.5 text-stone-600">
              {isLandLive
                ? `Đang hiển thị ${publishedPlotsCount} thửa đất trên Marketplace`
                : 'Nhấn nút Chuyển trạng thái để xuất bản lên sàn'}
            </p>
          </div>
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
              <thead><tr><th>Mã thửa</th><th>Diện tích</th><th>Giá thuê / tháng</th><th>Giống & Quy trình (Expert)</th><th>Trạng thái & Sàn</th><th>Thao tác</th></tr></thead>
              <tbody>
                {plots.map((p) => {
                  const compatCount = Number(p.compatibleVarietiesCount) || (Array.isArray(p.crops) ? p.crops.length : 0);
                  return (
                    <tr key={p.plotId} onClick={() => setSelected(p.plotId)} className={`cursor-pointer ${String(selected) === String(p.plotId) ? 'bg-emerald-50' : ''}`}>
                      <td className="font-mono font-bold text-brand-dark">{p.plotCode}</td>
                      <td>{formatArea(Number(p.area))}</td>
                      <td className="font-bold text-brand-green">{money(p.pricePerPeriod)}</td>
                      <td>
                        {compatCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đã gán {compatCount} giống & quy trình
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" /> Chờ Expert thiết lập
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={plotStatusBadge(p.status)} size="sm">{plotStatusBadge(p.status)}</Badge>
                          {p.isPublished ? (
                            <button
                              type="button"
                              disabled={togglingPlotId === p.plotId}
                              onClick={(e) => handleTogglePlotPublish(p, e)}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Đang hiện trên sàn (Gỡ)
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={togglingPlotId === p.plotId}
                              onClick={(e) => handleTogglePlotPublish(p, e)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black shadow-2xs transition cursor-pointer ${
                                compatCount > 0
                                  ? 'bg-[#294C3B] text-white hover:bg-[#1f3a2d]'
                                  : 'border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>{compatCount > 0 ? 'DUYỆT & HIỆN LÊN SÀN' : 'CHỜ EXPERT CẤU HÌNH'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link to={`/admin/master-data/plots/create?editId=${p.plotId}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-green hover:bg-stone-100">
                          <PenLine className="h-3.5 w-3.5" />{cleanRing(p.boundary).length >= 3 ? 'Sửa' : 'Vẽ ranh giới'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
