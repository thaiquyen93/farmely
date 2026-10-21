// Nguồn sự thật duy nhất cho giỏ thuê thửa (Marketplace -> BookPlot).
// Khóa chuẩn = mã thửa (plot code) dạng "P-04"; plot_id số chỉ dùng khi gọi API.

export const CART_STORAGE_KEY = 'farmely_master_lease_selected_plots';
export const CROP_STORAGE_KEY = 'farmely_selected_crop_by_plot';

export const normalizePlotCode = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value).trim().replace(/^plot\s+/i, '').trim().toUpperCase();
  if (str.startsWith('PLT-HV-')) {
    str = 'P-' + str.replace('PLT-HV-', '');
  } else if (str.startsWith('PLT-')) {
    str = 'P-' + str.replace('PLT-', '');
  }
  return str;
};

const dedupeCodes = (codes) => {
  const seen = new Set();
  const out = [];
  (codes || []).forEach((c) => {
    const code = normalizePlotCode(c);
    if (code && !seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  });
  return out;
};

// So khớp chính xác theo mã thửa; chỉ khi chuỗi toàn chữ số mới so theo plot_id.
export const findPlotByCode = (plots, code) => {
  const target = normalizePlotCode(code);
  if (!target || !Array.isArray(plots)) return null;
  const byCode = plots.find((p) => normalizePlotCode(p?.code || p?.plotCode || p?.plot_code) === target);
  if (byCode) return byCode;
  if (/^\d+$/.test(target)) {
    const byId = plots.find((p) => String(p?.plot_id ?? p?.plotId) === target);
    if (byId) return byId;
  }
  const targetNum = target.replace(/\D/g, '');
  if (targetNum) {
    return plots.find((p) => {
      const pNum = String(p?.code || p?.plotCode || p?.plot_code || p?.plotId || p?.plot_id).replace(/\D/g, '');
      return pNum && parseInt(pNum, 10) === parseInt(targetNum, 10);
    }) || null;
  }
  return null;
};

export const loadCartCodes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return dedupeCodes(parsed.map((item) => (item && typeof item === 'object' ? item.code || item.id : item)));
  } catch {
    return [];
  }
};

export const saveCartCodes = (codes) => {
  try {
    const clean = dedupeCodes(codes);
    if (clean.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
    else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error(e);
  }
};

export const removeCartCodes = (codes) => {
  const remove = new Set(dedupeCodes(codes));
  saveCartCodes(loadCartCodes().filter((c) => !remove.has(c)));
};

// ===== Cấu hình thuê theo từng thửa (giống cây + hình thức canh tác + thời hạn) =====
// Lưu ở localStorage dạng { "P-04": { cropId, cultivationMode, termMonths } }.
// Module này không import gì để plugin Node (dev server) dùng chung được.

export const LEASE_CONFIG_STORAGE_KEY = 'farmely_lease_config_by_plot';
export const CULTIVATION_MODES = { SELF: 'SELF', ASSISTED: 'ASSISTED' };
export const ALLOWED_TERM_MONTHS = [1, 3, 6, 12];
export const DEFAULT_TERM_MONTHS = 3;
export const BR04_LONG_CYCLE_DAYS = 35;
export const CARE_FEE_RATE = 0.5;

export const LEASE_TERM_OPTIONS = [
  { months: 1, title: '1 Tháng', cycleName: 'Ngắn hạn thử nghiệm', short: 'Thử nghiệm', tag: 'Chỉ rau ngắn ngày' },
  { months: 3, title: '3 Tháng', cycleName: '1 Vụ Mùa Tiêu Chuẩn', short: '1 vụ', tag: 'Khuyên Dùng', recommended: true },
  { months: 6, title: '6 Tháng', cycleName: '2 Vụ Mùa Luân Canh', short: '2 vụ', tag: 'Kỳ Hạn Dài' },
  { months: 12, title: '12 Tháng', cycleName: 'Trọn Năm (4 Vụ)', short: '4 vụ', tag: 'Kỳ Hạn Dài' }
];

const isValidMode = (mode) => mode === CULTIVATION_MODES.SELF || mode === CULTIVATION_MODES.ASSISTED;

// Số ngày sinh trưởng: số -> chính nó; crop -> số lớn nhất trong duration, sau đó minDays.
export const getCropGrowthDays = (cropOrDays) => {
  if (cropOrDays === null || cropOrDays === undefined) return 0;
  if (typeof cropOrDays === 'number') return Number.isFinite(cropOrDays) ? cropOrDays : 0;
  if (typeof cropOrDays === 'string' && /^\d+$/.test(cropOrDays.trim())) return Number(cropOrDays);
  const nums = String(cropOrDays.duration || '').match(/\d+/g);
  if (nums && nums.length) return Math.max(...nums.map(Number));
  return Number(cropOrDays.minDays) || 0;
};

// BR04: chu kỳ > 35 ngày -> tối thiểu 3 tháng; Assisted cũng tối thiểu 3 tháng.
export const getMinTermMonths = ({ growthDays = 0, cultivationMode = null } = {}) =>
  Number(growthDays) > BR04_LONG_CYCLE_DAYS || cultivationMode === CULTIVATION_MODES.ASSISTED ? 3 : 1;

export const getTermLockReason = (months, { growthDays = 0, cultivationMode = null } = {}) => {
  if (Number(months) >= 3) return '';
  if (Number(growthDays) > BR04_LONG_CYCLE_DAYS) return 'BR04';
  if (cultivationMode === CULTIVATION_MODES.ASSISTED) return 'ASSISTED';
  return '';
};

export const getLeaseTermError = ({ termMonths, cultivationMode, growthDays = 0, varietyName } = {}) => {
  const months = Number(termMonths);
  if (!ALLOWED_TERM_MONTHS.includes(months)) return 'Thời hạn thuê không hợp lệ (chỉ 1, 3, 6 hoặc 12 tháng).';
  if (!isValidMode(cultivationMode)) return 'Vui lòng chọn hình thức canh tác (Self-Growing hoặc Assisted-Growing).';
  const reason = getTermLockReason(months, { growthDays, cultivationMode });
  if (reason === 'BR04') {
    return `Giống ${varietyName || 'đã chọn'} có chu kỳ sinh trưởng ${growthDays} ngày (trên 35 ngày), thời hạn thuê tối thiểu 3 tháng (BR04).`;
  }
  if (reason === 'ASSISTED') return 'Gói Assisted-Growing yêu cầu thời hạn thuê tối thiểu 3 tháng (1 vụ mùa).';
  return '';
};

export const getLeaseConfigError = (config, crop) => {
  if (!crop) return 'Vui lòng chọn giống cây trồng cho thửa này.';
  return getLeaseTermError({ ...(config || {}), growthDays: getCropGrowthDays(crop), varietyName: crop.variety });
};

export const normalizeLeaseConfig = (raw, crop) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  const cropId = src.cropId ? String(src.cropId) : '';
  const cultivationMode = isValidMode(src.cultivationMode) ? src.cultivationMode : null;
  let termMonths = Number(src.termMonths);
  if (!ALLOWED_TERM_MONTHS.includes(termMonths)) termMonths = DEFAULT_TERM_MONTHS;
  const min = getMinTermMonths({ growthDays: getCropGrowthDays(crop), cultivationMode });
  if (termMonths < min) termMonths = min;
  return { cropId, cultivationMode, termMonths };
};

export const getCareFeePerMonth = (monthlyRent) => Math.round((Number(monthlyRent) || 0) * CARE_FEE_RATE);

export const computePlotLeasePrice = ({ monthlyRent, termMonths, cultivationMode } = {}) => {
  const rent = Number(monthlyRent) || 0;
  const months = Number(termMonths) || 0;
  const careFeePerMonth = getCareFeePerMonth(rent);
  const rentTotal = rent * months;
  const careTotal = cultivationMode === CULTIVATION_MODES.ASSISTED ? careFeePerMonth * months : 0;
  return { rentTotal, careFeePerMonth, careTotal, total: rentTotal + careTotal };
};

const readJsonObject = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const loadLeaseConfigMap = () => {
  const out = {};
  Object.entries(readJsonObject(LEASE_CONFIG_STORAGE_KEY)).forEach(([key, value]) => {
    const code = normalizePlotCode(key);
    if (code && value && typeof value === 'object') out[code] = { ...value };
  });
  // Di trú dữ liệu cũ { "P-04": "CRP-03" }.
  Object.entries(readJsonObject(CROP_STORAGE_KEY)).forEach(([key, cropId]) => {
    const code = normalizePlotCode(key);
    if (code && cropId && typeof cropId === 'string' && !out[code]) out[code] = { cropId };
  });
  return out;
};

export const saveLeaseConfigMap = (map) => {
  try {
    const clean = {};
    Object.entries(map || {}).forEach(([key, value]) => {
      const code = normalizePlotCode(key);
      if (code && value && typeof value === 'object') clean[code] = value;
    });
    localStorage.setItem(LEASE_CONFIG_STORAGE_KEY, JSON.stringify(clean));
    localStorage.removeItem(CROP_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
};

export const loadCropMap = () => {
  const out = {};
  Object.entries(loadLeaseConfigMap()).forEach(([code, cfg]) => {
    if (cfg?.cropId) out[code] = cfg.cropId;
  });
  return out;
};

export const saveCropMap = (map) => {
  const configs = loadLeaseConfigMap();
  Object.entries(map || {}).forEach(([key, cropId]) => {
    const code = normalizePlotCode(key);
    if (code) configs[code] = { ...(configs[code] || {}), cropId: cropId || '' };
  });
  saveLeaseConfigMap(configs);
};

export const formatTermShort = (months) => {
  const m = Number(months);
  const opt = LEASE_TERM_OPTIONS.find((o) => o.months === m);
  if (!opt || m === 1) return `${m} tháng`;
  return `${m} tháng · ${opt.short}`;
};

// Tổng hợp giỏ: mỗi thửa có cấu hình riêng; total = tổng total từng thửa.
export const buildCartSummary = (plots, configMap, getCrop) => {
  const items = (plots || []).map((plot) => {
    const code = normalizePlotCode(plot?.code || plot?.plotCode || plot?.plot_code || plot?.id);
    const raw = (configMap || {})[code];
    const crop = raw?.cropId && typeof getCrop === 'function' ? getCrop(raw.cropId) || null : null;
    const config = normalizeLeaseConfig(raw, crop);
    const error = getLeaseConfigError(config, crop);
    const price = computePlotLeasePrice({ monthlyRent: plot?.rentalPrice, ...config });
    return { code, plot, config, crop, error, price };
  });
  return {
    items,
    total: items.reduce((sum, it) => sum + it.price.total, 0),
    configuredCount: items.filter((it) => !it.error).length
  };
};

export const buildBookingUrl = (codes) => {
  const clean = dedupeCodes(codes);
  if (clean.length === 0) return '/marketplace';
  return `/marketplace/plot/${encodeURIComponent(clean[0])}/book?plots=${clean.map(encodeURIComponent).join(',')}`;
};

// Không có dữ liệu tương thích (null/rỗng) -> trả toàn bộ danh mục, hasData=false.
export const filterCompatibleCrops = (crops, varietyIds) => {
  const list = Array.isArray(crops) ? crops : [];
  if (!Array.isArray(varietyIds) || varietyIds.length === 0) {
    return { crops: list, hasData: false };
  }
  const allowed = new Set(varietyIds.map(Number));
  return { crops: list.filter((c) => allowed.has(Number(c.varietyId))), hasData: true };
};

const compatibilityCache = new Map();

export const clearCompatibilityCache = () => compatibilityCache.clear();

// GET /api/plots/{id}/compatibility -> number[] varietyId, hoặc null khi lỗi.
export const fetchCompatibleVarietyIds = (plotDbId) => {
  const key = String(plotDbId ?? '');
  if (!/^\d+$/.test(key)) return Promise.resolve(null);
  if (compatibilityCache.has(key)) return compatibilityCache.get(key);
  const request = fetch(`/api/plots/${key}/compatibility`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((json) => {
      const rows = Array.isArray(json) ? json : json?.data;
      if (!Array.isArray(rows)) return null;
      return rows.map((r) => Number(r.varietyId ?? r.variety_id)).filter((n) => Number.isFinite(n));
    })
    .catch(() => {
      compatibilityCache.delete(key);
      return null;
    });
  compatibilityCache.set(key, request);
  return request;
};
