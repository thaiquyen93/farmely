import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import BoundaryDrawMap from '../../components/admin/BoundaryDrawMap';
import { farmApi, PLOT_STATUS_OPTIONS } from '../../api/farm/farmApi';
import { areaM2, cleanRing, formatArea, validateRing } from '../../utils/polygonGeometry';
import { AlertTriangle, ArrowLeft, Loader2, Lock, Save } from 'lucide-react';

export default function PlotForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const defaultLandId = searchParams.get('landId');
  const navigate = useNavigate();

  const [lands, setLands] = useState([]);
  const [landId, setLandId] = useState(defaultLandId || '');
  const [land, setLand] = useState(null); // chi tiết nông trại đang chọn (ranh giới + thửa khác)
  const [code, setCode] = useState('');
  const [manualArea, setManualArea] = useState('');
  const [price, setPrice] = useState('1200000');
  const [status, setStatus] = useState('AVAIL');
  const [isPublished, setIsPublished] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [boundary, setBoundary] = useState([]);
  const [originalStatus, setOriginalStatus] = useState(null);
  const [originalCode, setOriginalCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [landLoading, setLandLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Danh sách nông trại + (nếu sửa) dữ liệu thửa hiện tại
  useEffect(() => {
    let alive = true;
    Promise.all([farmApi.listLands(), editId ? farmApi.getPlot(editId) : Promise.resolve(null)])
      .then(([landList, plot]) => {
        if (!alive) return;
        setLands(landList || []);
        if (plot) {
          setLandId(String(plot.landId));
          setCode(plot.plotCode || '');
          setOriginalCode(plot.plotCode || '');
          setManualArea(plot.area != null ? String(plot.area) : '');
          setPrice(plot.pricePerPeriod != null ? String(plot.pricePerPeriod) : '');
          setStatus(plot.status || 'AVAIL');
          setOriginalStatus(plot.status);
          setIsPublished(Boolean(plot.isPublished));
          setImageUrl(plot.imageUrl || '');
          setBoundary(plot.boundary || []);
        } else if (!defaultLandId && landList?.length) {
          setLandId(String(landList[0].landId));
        }
      })
      .catch((e) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [editId, defaultLandId]);

  // Khi đổi nông trại: tải ranh giới nông trại + các thửa đã có để làm ngữ cảnh vẽ
  useEffect(() => {
    if (!landId) { setLand(null); return undefined; }
    let alive = true;
    setLandLoading(true);
    farmApi.getLand(landId)
      .then((d) => alive && setLand(d))
      .catch(() => alive && setLand(null))
      .finally(() => alive && setLandLoading(false));
    return () => { alive = false; };
  }, [landId]);

  const outer = land?.boundary?.length >= 3 ? { ring: land.boundary, label: land.landName } : null;
  const others = useMemo(
    () => (land?.plots || [])
      .filter((p) => String(p.plotId) !== String(editId) && p.boundary?.length >= 3)
      .map((p) => ({ label: p.plotCode, ring: p.boundary })),
    [land, editId]
  );

  const ring = useMemo(() => cleanRing(boundary), [boundary]);
  const hasRing = ring.length >= 3;
  const ringCheck = hasRing ? validateRing(ring, { outer: outer?.ring, outerName: outer?.label, others }) : null;
  const lockedBoundary = editId && originalStatus === 'RENT';

  const validate = () => {
    const errs = {};
    if (!landId) errs.landId = 'Chọn nông trại chứa thửa đất.';
    if (!code.trim()) errs.code = 'Nhập mã thửa đất (vd P-17).';
    if (!hasRing && !(Number(manualArea) > 0)) errs.area = 'Vẽ ranh giới trên bản đồ hoặc nhập diện tích.';
    if (!(Number(price) >= 0) || price === '') errs.price = 'Nhập giá thuê hợp lệ.';
    if (ringCheck && !ringCheck.ok) errs.boundary = ringCheck.errors[0];
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setIsSaving(true);
    try {
      const body = {
        landId: Number(landId),
        plotCode: code.trim(),
        area: hasRing ? null : Number(manualArea),
        pricePerPeriod: Number(price),
        status,
        isPublished,
        imageUrl: imageUrl.trim() || null,
        boundary: lockedBoundary ? undefined : ring
      };
      const saved = editId ? await farmApi.updatePlot(editId, body) : await farmApi.createPlot(body);
      if (saved?.landId) {
        localStorage.setItem('farmely_selected_land_id', String(saved.landId));
      }
      navigate(`/admin/master-data/lands/${saved.landId}`, { state: { flash: `${editId ? 'Đã lưu' : 'Đã tạo'} thửa ${saved.plotCode} (${formatArea(Number(saved.area))}).`, highlightPlotId: saved.plotId } });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải dữ liệu…</div>;
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Không tải được dữ liệu</p>
        <p className="mt-1">{loadError}</p>
        <Link to="/admin/master-data/plots" className="mt-3 inline-block font-semibold underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/master-data/plots" className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-dark" aria-label="Quay lại">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">Quản trị Master Data</span>
          <h2 className="font-heading text-2xl font-black text-brand-dark">{editId ? `Chỉnh sửa thửa đất: ${originalCode}` : 'Thêm thửa đất canh tác mới'}</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Mã thửa đất" required placeholder="P-17" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} error={errors.code} maxLength={50} />
          <div className="sm:col-span-2">
            <Select
              label="Thuộc nông trại"
              required
              value={landId}
              onChange={(e) => { setLandId(e.target.value); }}
              error={errors.landId}
              options={[{ value: '', label: '— Chọn nông trại —' }, ...lands.map((l) => ({ value: String(l.landId), label: `${l.landName}${l.boundary ? '' : ' (chưa khoanh vùng)'}` }))]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Giá thuê / tháng (VND)" type="number" min={0} step={1000} required value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
          <Select label="Trạng thái" required value={status} onChange={(e) => setStatus(e.target.value)} options={PLOT_STATUS_OPTIONS} />
          <Input label="Ảnh đại diện (URL)" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-brand-dark">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-brand-border text-brand-green focus:ring-brand-green" />
          Niêm yết lên Marketplace
        </label>

        <section className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Ranh giới thửa đất trên bản đồ</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                {outer ? `Vẽ bên trong ranh giới vàng của ${outer.label}. Đặt góc gần góc thửa bên cạnh để tự hút khít bờ.` : 'Nông trại này chưa khoanh vùng — bạn vẫn vẽ được thửa, nhưng nên khoanh vùng nông trại trước.'}
              </p>
            </div>
            <p className="text-sm text-stone-600">Diện tích: <strong className="text-brand-dark">{hasRing ? formatArea(areaM2(ring)) : 'chưa vẽ'}</strong></p>
          </div>

          {lockedBoundary ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />Thửa đang có khách thuê nên không thể sửa ranh giới — diện tích trong hợp đồng sẽ không còn khớp.
            </div>
          ) : landLoading ? (
            <div className="flex h-[460px] items-center justify-center gap-2 rounded-2xl border border-brand-border bg-stone-50 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải bản đồ nông trại…</div>
          ) : (
            <BoundaryDrawMap key={landId || 'none'} kind="plot" value={boundary} onChange={setBoundary} outer={outer} others={others} />
          )}
          {errors.boundary && <p className="text-xs font-medium text-rose-600">{errors.boundary}</p>}

          {!hasRing && (
            <div className="max-w-xs pt-2">
              <Input label="Hoặc nhập diện tích (m²)" type="number" min={0.01} step={0.01} value={manualArea} onChange={(e) => setManualArea(e.target.value)} error={errors.area} helperText="Chỉ dùng khi chưa vẽ ranh giới." />
            </div>
          )}
        </section>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-brand-border/60 pt-4">
          <Link to="/admin/master-data/plots"><Button type="button" variant="outline" size="md">Huỷ bỏ</Button></Link>
          <Button type="submit" variant="primary" size="md" icon={Save} loading={isSaving}>{editId ? 'LƯU THAY ĐỔI' : 'TẠO THỬA ĐẤT MỚI'}</Button>
        </div>
      </form>
    </div>
  );
}
