/**
 * PLOT BADGE — Nhãn nổi trên tâm mỗi thửa đất.
 *
 * Yêu cầu hiển thị: MỌI thửa luôn hiện MÃ THỬA + TRẠNG THÁI ĐẤT để nhìn bản đồ là
 * biết ngay thửa nào còn trống. Giá / diện tích / cây trồng / tiện ích là thông
 * tin phụ, chỉ mở ra khi rê chuột (CSS group-hover) hoặc khi thửa đang được chọn.
 *
 * Mọi node con được tạo MỘT LẦN trong factory. setSelected chỉ bật/tắt class,
 * inline style, hidden và textContent trên các node đó — không gán lại HTML,
 * vì làm vậy sẽ phá mọi CSS transition đang chạy.
 *
 * `element` là node MapLibre gắn class .maplibregl-marker và định vị bằng
 * `position: absolute` + inline transform. Không được thêm utility position hay
 * transform lên `element`: nó sẽ đè vị trí marker và kéo cả 16 badge về góc trái.
 */

import { getStatusConfig, isAvailableStatus } from '../../../utils/mapTheme';

/** Format giá tiền ngắn gọn (ví dụ: 1.2 tr, 1.45 tr) */
export function formatCompactPrice(props = {}) {
  const toCompact = (num) => {
    const millions = num / 1000000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(2).replace(/\.?0+$/, '')} tr`;
  };

  if (props.rentalPrice) return toCompact(props.rentalPrice);

  if (props.price) {
    const num = parseInt(String(props.price).replace(/\D/g, ''), 10);
    if (!Number.isNaN(num) && num > 0) return toCompact(num);
  }
  return '';
}

/** Cắt chuỗi cho vừa 1 dòng (giữ lại cho nơi khác dùng) */
export function truncateName(name = '', maxLength = 22) {
  const text = String(name || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** '#10B981' -> 'rgba(16, 185, 129, a)'; giá trị không phải hex thì trả nguyên */
function withAlpha(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const BASE_CLASS =
  'relative w-max whitespace-nowrap inline-flex items-center gap-1.5 rounded-full cursor-pointer select-none pointer-events-auto transition-all duration-300 ease-out';

/** Khung badge theo trạng thái + đang được chọn hay không */
export function getBadgeClassName(props = {}, isSelected = false) {
  if (isSelected) {
    return `${BASE_CLASS} pl-2 pr-1.5 py-1 text-[11px] bg-emerald-600 text-white border-2 border-white shadow-panel ring-2 ring-emerald-400/70 scale-110 animate-pulseGlow font-extrabold`;
  }

  if (isAvailableStatus(props.status)) {
    return `${BASE_CLASS} pl-1.5 pr-1 py-[3px] text-[10px] bg-white/95 backdrop-blur-md text-slate-900 border border-emerald-300 shadow-float hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-panel font-extrabold`;
  }

  // Đã thuê / bảo trì: vẫn đọc được mã + trạng thái, nhưng tông trầm để không
  // cạnh tranh với các thửa còn trống
  return `${BASE_CLASS} pl-1.5 pr-1 py-[3px] text-[10px] bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-600/70 shadow-float hover:-translate-y-0.5 hover:bg-slate-900/95 font-bold`;
}

/** Chấm trạng thái */
function getDotClassName(props = {}, isSelected = false) {
  const base = 'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300';
  if (isSelected) return `${base} bg-white`;
  if (isAvailableStatus(props.status)) return `${base} animate-pulse`;
  return base;
}

/** Chip trạng thái đất — luôn hiển thị */
function getStatusChipClassName(isSelected = false) {
  return `px-1.5 py-[1px] rounded-full text-[9px] font-bold leading-[14px] tracking-tight transition-colors duration-300 ${
    isSelected ? 'bg-white/20 text-white' : ''
  }`;
}

/** Mũi neo nhỏ dưới đáy badge — để badge "dính" vào thửa đất */
export function getTailClassName(props = {}, isSelected = false) {
  const base =
    'absolute left-1/2 -translate-x-1/2 -bottom-[4px] w-2 h-2 rotate-45 rounded-[1px] pointer-events-none transition-all duration-300';

  if (isSelected) return `${base} bg-emerald-600 border-b-2 border-r-2 border-white`;
  if (isAvailableStatus(props.status)) return `${base} bg-white/95 border-b border-r border-emerald-300`;
  return `${base} bg-slate-900/80 border-b border-r border-slate-600/70`;
}

/**
 * Khối thông tin phụ: rộng 0 khi thu gọn, chỉ mở khi hover (CSS thuần, không
 * listener JS), mở sẵn khi đang được chọn.
 */
function getRevealClassName(isSelected = false) {
  const base = 'inline-flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-out';
  if (isSelected) return `${base} max-w-[200px] opacity-100`;
  return `${base} max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100`;
}

function getDividerClassName(isSelected = false) {
  return isSelected ? 'inline-block w-px h-3 bg-white/40 shrink-0' : 'inline-block w-px h-3 bg-slate-300/80 shrink-0';
}

function getMutedClassName(props = {}, isSelected = false) {
  if (isSelected) return 'tracking-tight font-semibold text-white/85';
  if (isAvailableStatus(props.status)) return 'tracking-tight font-semibold text-slate-500';
  return 'tracking-tight font-semibold text-slate-400';
}

function getPriceClassName(props = {}, isSelected = false) {
  if (isSelected) return 'tracking-tight font-extrabold text-white';
  if (isAvailableStatus(props.status)) return 'tracking-tight font-extrabold text-emerald-700';
  return 'tracking-tight font-semibold text-slate-400 line-through';
}

/**
 * Tạo 1 badge marker.
 * @param {{ properties: object, onClick?: Function, enterDelayMs?: number, isSelected?: boolean }} config
 * @returns {{ element: HTMLElement, badge: HTMLElement, nodes: object, setSelected: Function, destroy: Function }}
 */
export function createPlotBadge({
  properties = {},
  onClick,
  enterDelayMs = 0,
  isSelected = false,
} = {}) {
  const statusConfig = getStatusConfig(properties.status);
  const vacant = isAvailableStatus(properties.status);
  const priceStr = formatCompactPrice(properties);
  const facilities = properties.facilities || {};
  const firstCrop = Array.isArray(properties.crops) ? properties.crops[0] : '';

  // `element` = phần tử MapLibre định vị (position + transform). TUYỆT ĐỐI không gắn
  // animation/transform/position lên nó: bất kỳ CSS cũ hay lạ nào chạm `transform`
  // ở đây đều kéo badge về góc trái màn hình. Animation vào sân khấu nằm ở `enter`.
  const element = document.createElement('div');
  element.className = 'group z-10 hover:z-40 select-none pointer-events-auto';

  const enter = document.createElement('div');
  enter.className = 'animate-fadeInUp';
  enter.style.animationDelay = `${Math.max(0, enterDelayMs)}ms`;

  const badge = document.createElement('div');
  badge.setAttribute('role', 'button');
  badge.setAttribute('aria-label', `${properties.id || ''} — ${statusConfig.label}${priceStr ? `, ${priceStr}/tháng` : ''}`);

  // --- Phần luôn hiển thị: chấm + mã thửa + chip trạng thái ---
  const dot = document.createElement('span');

  const idLabel = document.createElement('span');
  idLabel.className = 'tracking-tight';
  idLabel.textContent = properties.id || '';

  const statusChip = document.createElement('span');
  statusChip.textContent = statusConfig.label;

  // --- Phần mở ra khi hover / khi chọn: giá, diện tích, cây trồng, tiện ích ---
  const reveal = document.createElement('span');

  const divider = document.createElement('span');

  const priceLabel = document.createElement('span');
  priceLabel.textContent = priceStr;

  const areaLabel = document.createElement('span');
  areaLabel.textContent = properties.area || '';

  const cropLabel = document.createElement('span');
  cropLabel.textContent = firstCrop || '';

  const facilityWrap = document.createElement('span');
  facilityWrap.className = 'inline-flex items-center gap-0.5 shrink-0';

  const facIrrigation = document.createElement('span');
  facIrrigation.className = 'leading-none';
  facIrrigation.title = 'Tưới tự động';
  facIrrigation.textContent = '💧';

  const facIot = document.createElement('span');
  facIot.className = 'leading-none';
  facIot.title = 'Cảm biến IoT';
  facIot.textContent = '📡';

  const facSoil = document.createElement('span');
  facSoil.className = 'leading-none';
  facSoil.title = 'Đất hữu cơ';
  facSoil.textContent = '🌱';

  facilityWrap.append(facIrrigation, facIot, facSoil);
  reveal.append(divider, priceLabel, areaLabel, cropLabel, facilityWrap);

  const tail = document.createElement('span');

  badge.append(dot, idLabel, statusChip, reveal, tail);
  enter.appendChild(badge);
  element.appendChild(enter);

  const nodes = {
    enter,
    dot,
    idLabel,
    statusChip,
    reveal,
    divider,
    priceLabel,
    areaLabel,
    cropLabel,
    facilityWrap,
    facIrrigation,
    facIot,
    facSoil,
    tail,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(properties);
  };
  badge.addEventListener('click', handleClick);

  /** Chỉ đổi class / style / hidden trên các node đã có */
  function setSelected(selected) {
    const isSel = Boolean(selected);

    badge.className = getBadgeClassName(properties, isSel);
    dot.className = getDotClassName(properties, isSel);
    dot.style.backgroundColor = isSel ? '' : statusConfig.color;

    statusChip.className = getStatusChipClassName(isSel);
    statusChip.style.backgroundColor = isSel ? '' : withAlpha(statusConfig.color, vacant ? 0.14 : 0.28);
    statusChip.style.color = isSel ? '' : vacant ? '#047857' : statusConfig.strokeColor || statusConfig.color;

    reveal.className = getRevealClassName(isSel);
    divider.className = getDividerClassName(isSel);
    priceLabel.className = getPriceClassName(properties, isSel);

    const muted = getMutedClassName(properties, isSel);
    areaLabel.className = muted;
    cropLabel.className = muted;
    tail.className = getTailClassName(properties, isSel);

    priceLabel.hidden = !priceStr;
    areaLabel.hidden = !properties.area;
    // Cây trồng + tiện ích chỉ khoe ở thửa còn trống; khi chọn thì để panel chi
    // tiết bên phải lo, giữ badge gọn để không đè lên các thửa lân cận
    cropLabel.hidden = isSel || !vacant || !firstCrop;
    facIrrigation.hidden = isSel || !(vacant && facilities.irrigation);
    facIot.hidden = isSel || !(vacant && facilities.iot);
    facSoil.hidden = isSel || !(vacant && facilities.organicSoil);
    facilityWrap.hidden = facIrrigation.hidden && facIot.hidden && facSoil.hidden;

    badge.setAttribute('aria-pressed', String(isSel));
  }

  function destroy() {
    badge.removeEventListener('click', handleClick);
    if (element.parentNode) element.parentNode.removeChild(element);
  }

  setSelected(isSelected);

  return { element, badge, nodes, setSelected, destroy };
}
