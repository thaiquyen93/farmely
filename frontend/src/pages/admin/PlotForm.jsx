import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import BoundaryDrawMap from '../../components/admin/BoundaryDrawMap';
import { farmApi, PLOT_STATUS_OPTIONS } from '../../api/farm/farmApi';
import { notifyExpertsOfNewPlot } from '../../services/notificationService';
import { clearCompatibilityCache } from '../../utils/leaseSelection';
import { cleanRing, formatRecordedArea, validateRing } from '../../utils/polygonGeometry';
import { AlertTriangle, ArrowLeft, CheckCircle2, Globe, ImagePlus, Loader2, Lock, Save, Trash2, Upload } from 'lucide-react';

const parseArea = (value) => {
  const raw = String(value).trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const area = Number(raw);
  return Number.isFinite(area) && area > 0 ? area : null;
};

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
  const [carePrice, setCarePrice] = useState('0');
  const [status, setStatus] = useState('MAINT');
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const imageInputRef = useRef(null);

  // Danh sách nông trại + (nếu sửa) dữ liệu thửa hiện tại
  useEffect(() => {
    let alive = true;
    Promise.all([
      farmApi.listLands(),
      editId ? farmApi.getPlot(editId) : Promise.resolve(null)
    ])
      .then(([landList, plot]) => {
        if (!alive) return;
        setLands(landList || []);

        if (plot) {
          setLandId(String(plot.landId));
          setCode(plot.plotCode || '');
          setOriginalCode(plot.plotCode || '');
          setManualArea(plot.area != null ? Number(plot.area).toFixed(2) : '');
          setPrice(plot.pricePerPeriod != null ? String(plot.pricePerPeriod) : '');
          setCarePrice(plot.carePricePerMonth != null ? String(plot.carePricePerMonth) : '0');
          setStatus(plot.status || 'MAINT');
          setOriginalStatus(plot.status);
          setIsPublished(Boolean(plot.isPublished));
          setImageUrl(plot.imageUrl || '');
setBoundary(plot.boundary || []);
        } else {
          if (!defaultLandId && landList?.length) {
            setLandId(String(landList[0].landId));
          }
          // Thửa mới tạo: mặc định chưa kích hoạt (MAINT, isPublished=false) và chờ Expert gán giống cây & quy trình
          setStatus('MAINT');
          setIsPublished(false);
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

  const landRing = useMemo(() => cleanRing(land?.boundary || []), [land]);
  const outer = landRing.length >= 3 ? { ring: landRing, label: land.landName } : null;
  const others = useMemo(
    () => (land?.plots || [])
      .filter((p) => String(p.plotId) !== String(editId) && cleanRing(p.boundary || []).length >= 3)
      .map((p) => ({ label: p.plotCode, ring: cleanRing(p.boundary || []) })),
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
    if (parseArea(manualArea) == null) errs.area = 'Nhập diện tích lớn hơn 0, tối đa 2 chữ số thập phân.';
    if (!(Number(price) >= 0) || price === '') errs.price = 'Nhập giá thuê hợp lệ.';
    if (!(Number(carePrice) >= 0) || carePrice === '') errs.carePrice = 'Nhập giá dịch vụ chăm sóc hợp lệ.';
    if (ringCheck && !ringCheck.ok) errs.boundary = ringCheck.errors[0];
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageUploadError('');

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Dung lượng ảnh tối đa 5MB.');
      return;
    }

    setIsUploadingImage(true);
    setUploadedFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = sessionStorage.getItem('farmely_token') || localStorage.getItem('farmely_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const fileUrl = json?.data?.fileUrl || json?.fileUrl;
        if (fileUrl) {
          setImageUrl(fileUrl);
          return;
        }
      }
      throw new Error('upload_fallback');
    } catch {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        setImageUrl(dataUrl);
      } else {
        setImageUploadError('Không thể đọc tệp ảnh đã chọn.');
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setIsSaving(true);
    try {
      const effectiveStatus = isPublished && status === 'MAINT' ? 'AVAIL' : status;
      const body = {
        landId: Number(landId),
        plotCode: code.trim(),
        area: parseArea(manualArea),
        pricePerPeriod: Number(price),
        carePricePerMonth: Number(carePrice),
        status: effectiveStatus,
        isPublished,
        imageUrl: imageUrl.trim() || null,
        boundary: lockedBoundary ? undefined : ring
      };
      const saved = editId ? await farmApi.updatePlot(editId, body) : await farmApi.createPlot(body);
      if (!editId && saved) {
        await notifyExpertsOfNewPlot({ ...saved, plotCode: saved.plotCode || code.trim(), area: saved.area ?? body.area });
      }
      clearCompatibilityCache();
      if (saved?.landId) {
        localStorage.setItem('farmely_selected_land_id', String(saved.landId));
      }
      navigate(`/admin/master-data/lands/${saved.landId}`, {
        state: {
          flash: isPublished
            ? `Đã duyệt & xuất bản thửa ${saved.plotCode} (${formatRecordedArea(Number(saved.area))}) lên Marketplace!`
            : `${editId ? 'Đã lưu' : 'Đã tạo'} thửa ${saved.plotCode} ở trạng thái Chưa kích hoạt (chờ Expert thiết lập giống cây & quy trình).`,
          highlightPlotId: saved.plotId
        }
      });
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
          <Input
            label="Giá thuê / tháng (VND)"
            type="number"
            min={0}
            step={1000}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
          />
          <Input
            label="Dịch vụ trọn gói / Farmely chăm sóc (VND/tháng)"
            type="number"
            min={0}
            step={1000}
            value={carePrice}
            onChange={(e) => setCarePrice(e.target.value)}
            error={errors.carePrice}
          />
          <Select label="Trạng thái" required value={status} onChange={(e) => setStatus(e.target.value)} options={PLOT_STATUS_OPTIONS} />
        </div>

        {/* Upload ảnh đại diện thửa đất */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Ảnh đại diện thửa đất
          </label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-4">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white">
              {imageUrl ? (
                <img src={imageUrl} alt="Ảnh đại diện thửa đất" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-7 w-7 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-bold text-stone-800 truncate">
                {imageUrl ? (uploadedFileName || 'Đã chọn ảnh đại diện thửa đất') : 'Chưa có ảnh đại diện'}
              </p>
              <p className="text-xs text-stone-500">
                Tải lên ảnh thực tế của thửa đất (JPG, PNG, WEBP — tối đa 5MB) để hiển thị trên Marketplace.
              </p>
              {imageUploadError && (
                <p className="text-xs font-semibold text-rose-600">{imageUploadError}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition cursor-pointer disabled:opacity-50"
              >
                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{isUploadingImage ? 'Đang tải...' : imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setUploadedFileName('');
                    setImageUploadError('');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cấu hình Niêm Yết Marketplace */}
        <div className={`p-4 rounded-xl border transition-all ${
          isPublished 
            ? 'bg-emerald-50/90 border-emerald-300 shadow-sm' 
            : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-2 rounded-lg ${isPublished ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900">
                    Trạng thái Niêm yết (Publish lên Marketplace)
                  </span>
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đang hiển thị cho khách thuê
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                      Chưa niêm yết (Khách chưa thấy)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Khi bật & lưu, thửa đất này sẽ được đẩy lên Sàn giao dịch (Marketplace) để khách hàng có thể chọn thuê và chọn gói dịch vụ.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPublished(checked);
                  if (checked && status === 'MAINT') {
                    setStatus('AVAIL');
                  } else if (!checked && status === 'AVAIL') {
                    setStatus('MAINT');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-sm font-bold text-stone-900">
                {isPublished ? 'BẬT NIÊM YẾT' : 'TẮT NIÊM YẾT'}
              </span>
            </label>
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Ranh giới thửa đất trên bản đồ</h3>
            </div>
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

          <div className="max-w-xs pt-2">
            <Input label="Diện tích canh tác thực tế (m²)" required type="text" inputMode="decimal" value={manualArea} onChange={(e) => setManualArea(e.target.value)} error={errors.area} helperText="Admin xác nhận theo hồ sơ hoặc đo thực địa; số này dùng cho giá thuê và hợp đồng." />
          </div>
          {parseArea(manualArea) != null && <p aria-live="polite" className="text-xs font-semibold text-brand-green">Diện tích sẽ lưu: {formatRecordedArea(parseArea(manualArea))}</p>}
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

