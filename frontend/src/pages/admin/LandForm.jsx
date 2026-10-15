import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import BoundaryDrawMap from '../../components/admin/BoundaryDrawMap';
import { farmApi } from '../../api/farm/farmApi';
import { cleanRing, interiorPoint, parseGpsPoint, pointInPolygon, validateRing } from '../../utils/polygonGeometry';
import { AlertTriangle, ArrowLeft, Info, Loader2, MapPin, Save } from 'lucide-react';

/**
 * Tạo / sửa nông trại:
 *  1. Admin nhập 1 toạ độ GPS của khu đất -> bản đồ bay tới và ghim đúng vị trí đó.
 *  2. Admin tự vẽ 4 cạnh (hoặc nhiều hơn) bao quanh khu đất trên ảnh vệ tinh.
 *  3. Lưu: ranh giới vẽ được gửi lên farm-service.
 */
export default function LandForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [gpsText, setGpsText] = useState('');
  const [pin, setPin] = useState(null); // [lng, lat]
  const [gpsError, setGpsError] = useState('');
  const [flyKey, setFlyKey] = useState(0);
  const [boundary, setBoundary] = useState([]);
  const [existingPlots, setExistingPlots] = useState([]);
  const [originalName, setOriginalName] = useState('');

  const [loading, setLoading] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editId) return undefined;
    let alive = true;
    farmApi.getLand(editId)
      .then((land) => {
        if (!alive) return;
        setName(land.landName || '');
        setOriginalName(land.landName || '');
        setAddress(land.address || '');
        setDescription(land.description || '');
        const ring = cleanRing(land.boundary || []);
        setBoundary(ring);
        if (ring.length >= 3) {
          const c = interiorPoint(ring);
          setPin(c);
          setGpsText(`${c[1].toFixed(6)}, ${c[0].toFixed(6)}`);
        }
        setExistingPlots((land.plots || []).filter((p) => p.boundary?.length >= 3).map((p) => ({ label: p.plotCode, ring: p.boundary })));
      })
      .catch((e) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [editId]);

  const ring = useMemo(() => cleanRing(boundary), [boundary]);
  const ringCheck = ring.length >= 3 ? validateRing(ring, { mustContain: existingPlots }) : null;
  const pinOutside = pin && ring.length >= 3 && !pointInPolygon(pin, ring);

  const locate = (e) => {
    e?.preventDefault?.();
    const r = parseGpsPoint(gpsText);
    if (!r.point) {
      setGpsError(r.error);
      return;
    }
    setGpsError('');
    setPin(r.point);
    setFlyKey((k) => k + 1);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập tên khu nông trại.';
    if (!address.trim()) errs.address = 'Vui lòng nhập địa chỉ thực địa.';
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
      const body = { landName: name.trim(), address: address.trim(), description: description.trim(), boundary: ring };
      const saved = editId ? await farmApi.updateLand(editId, body) : await farmApi.createLand(body);
      if (saved?.landId) {
        localStorage.setItem('farmely_selected_land_id', String(saved.landId));
      }
      navigate(`/admin/master-data/lands/${saved.landId}`, { state: { flash: editId ? 'Đã lưu thay đổi nông trại.' : 'Đã tạo nông trại mới.' } });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải nông trại…</div>;
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Không tải được nông trại #{editId}</p>
        <p className="mt-1">{loadError}</p>
        <Link to="/admin/master-data/lands" className="mt-3 inline-block font-semibold underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/master-data/lands" className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-dark" aria-label="Quay lại">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">Quản trị Master Data</span>
          <h2 className="font-heading text-2xl font-black text-brand-dark">{editId ? `Chỉnh sửa nông trại: ${originalName}` : 'Thêm khu nông trại mới'}</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Tên khu nông trại" required placeholder="Ví dụ: Nông trại Củ Chi Eco Farm" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={150} />
          <Input label="Địa chỉ thực địa" required placeholder="Ví dụ: Xã An Phú, Huyện Củ Chi, TP.HCM" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} />
        </div>

        <div>
          <label htmlFor="land-desc" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-dark">Mô tả tổng quan & thổ nhưỡng</label>
          <textarea
            id="land-desc"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vị trí địa lý, tầng đất, nguồn nước và hệ thống tưới tiêu…"
            className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Vị trí & ranh giới khu đất</h3>
            <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-stone-500">
              <li>Nhập toạ độ GPS của khu đất rồi bấm <strong>Ghim vị trí</strong> — bản đồ bay tới và cắm ghim đỏ.</li>
              <li>Bấm <strong>Vẽ ranh giới</strong>, chấm lần lượt các góc hàng rào quanh khu đất (4 góc trở lên).</li>
              <li>Bấm lại góc đầu tiên hoặc nhấn Enter để khép vùng, rồi lưu.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor="land-gps" className="sr-only">Toạ độ GPS</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                <input
                  id="land-gps"
                  value={gpsText}
                  onChange={(e) => setGpsText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') locate(e); }}
                  placeholder={`Ví dụ: 10.687662, 106.350258  hoặc  10°41'15"N 106°21'01"E`}
                  aria-invalid={Boolean(gpsError)}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 font-mono text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20 ${gpsError ? 'border-rose-300' : 'border-brand-border'}`}
                />
              </div>
              {gpsError && <p className="mt-1 text-xs font-medium text-rose-600">{gpsError}</p>}
            </div>
            <Button type="button" variant="secondary" size="md" icon={MapPin} onClick={locate}>Ghim vị trí</Button>
          </div>

          <BoundaryDrawMap
            kind="land"
            value={boundary}
            onChange={setBoundary}
            others={existingPlots}
            mustContain={existingPlots}
            pin={pin}
            focusKey={flyKey}
            hideCoordSearch
            height={480}
          />

          {pinOutside && (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Ghim GPS đang nằm ngoài vùng vừa vẽ. Kiểm tra lại toạ độ hoặc ranh giới.
            </p>
          )}
          {errors.boundary && <p className="text-xs font-medium text-rose-600">{errors.boundary}</p>}
          {existingPlots.length > 0 && (
            <p className="text-xs text-stone-500">Nông trại đang có {existingPlots.length} thửa đã vẽ (màu tối trên bản đồ). Ranh giới mới phải bao trọn các thửa này.</p>
          )}
        </section>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-brand-border/60 pt-4">
          <Link to="/admin/master-data/lands"><Button type="button" variant="outline" size="md">Huỷ bỏ</Button></Link>
          <Button type="submit" variant="primary" size="md" icon={Save} loading={isSaving}>{editId ? 'LƯU THAY ĐỔI' : 'TẠO NÔNG TRẠI MỚI'}</Button>
        </div>
      </form>
    </div>
  );
}
