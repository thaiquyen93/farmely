/**
 * PLOT BADGE — Factory tạo badge giá nổi trên tâm mỗi thửa đất (phong cách Airbnb).
 *
 * Điểm quan trọng: MỌI node con (chấm trạng thái, mã thửa, giá, khối thông tin
 * mở ra khi hover, mũi neo) được tạo MỘT LẦN trong factory. setSelected chỉ
 * bật/tắt class / hidden / textContent trên đúng các node đó —
 * KHÔNG gán lại innerHTML, vì gán innerHTML sẽ phá mọi CSS transition đang chạy.
 *
 * Ba tầng hiển thị (progressive disclosure) vì có 16 badge cùng lúc trên bản đồ:
 *  1. Thu gọn  : viên thuốc kính mờ + chấm trạng thái + giá rút gọn
 *  2. Hover    : mở rộng bằng CSS (group-hover) để hé diện tích, cây trồng, tiện ích
 *  3. Đang chọn: thẻ emerald đầy đủ mã thửa, tên, giá, diện tích, hướng, chip VietGAP
 */

import { getStatusConfig, isAvailableStatus } from '../../../utils/mapTheme';

/** Format giá tiền ngắn gọn phong cách Airbnb (ví dụ: 1.2 tr, 1.45 tr) */
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

const BASE_CLASS =
  'relative w-max whitespace-nowrap inline-flex items-center cursor-pointer select-none pointer-events-auto transition-all duration-300 ease-out';

/** Class của khung badge theo trạng thái + có đang được chọn hay không */
export function getBadgeClassName(props = {}, isSelected = false) {
  if (isSelected) {
    return `${BASE_CLASS} gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-emerald-600 text-white shadow-xl shadow-emerald-950/40 border-2 border-white scale-110 ring-2 ring-emerald-400 animate-pulseGlow z-30 font-extrabold`;
  }

  if (isAvailableStatus(props.status)) {
    // Thửa CÒN TRỐNG: viên thuốc kính mờ, thu gọn để không tràn lấn thửa bên cạnh
    return `${BASE_CLASS} gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/95 backdrop-blur-md text-slate-900 border border-emerald-400/80 shadow-float ring-1 ring-white/50 hover:scale-105 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-panel hover:z-20 font-extrabold`;
  }

  // Thửa ĐÃ THUÊ: tag khiêm tốn, tối mờ, chìm dưới nền
  return `${BASE_CLASS} gap-1 px-1.5 py-0.5 rounded-full text-[9px] bg-slate-900/70 backdrop-blur-sm text-slate-300 border border-slate-700/60 shadow-sm opacity-60 hover:opacity-95 hover:scale-105 font-medium`;
}

/** Class của chấm trạng thái */
function getDotClassName(props = {}, isSelected = false) {
  if (isSelected) {
    return 'rounded-full shrink-0 transition-all duration-300 w-1.5 h-1.5 bg-white animate-ping';
  }
  if (isAvailableStatus(props.status)) {
    return 'rounded-full shrink-0 transition-all duration-300 w-1.5 h-1.5 animate-pulse';
  }
  return 'rounded-full shrink-0 transition-all duration-300 w-1 h-1 opacity-80';
}

/** Mũi neo nhỏ hình thoi dưới đáy badge — để viên thuốc "dính" vào thửa đất */
export function getTailClassName(props = {}, isSelected = false) {
  const base =
    'absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-2 h-2 rotate-45 rounded-[1px] pointer-events-none transition-all duration-300';

  if (isSelected) {
    return `${base} bg-emerald-600 border-b-2 border-r-2 border-white`;
  }
  if (isAvailableStatus(props.status)) {
    return `${base} bg-white/95 border-b border-r border-emerald-400/80`;
  }
  return `${base} bg-slate-900/70 border-b border-r border-slate-700/60`;
}

/**
 * Khối thông tin phụ: thu gọn về chiều rộng 0 khi không chọn (chỉ mở khi hover),
 * mở sẵn khi đang được chọn. Hoàn toàn bằng CSS nên không rò listener.
 */
function getRevealClassName(isSelected = false) {
  const base =
    'inline-flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out';
  if (isSelected) {
    return `${base} max-w-[320px] opacity-100`;
  }
  return `${base} max-w-0 opacity-0 group-hover:max-w-[240px] group-hover:opacity-100`;
}

/** Class cho các nhãn phụ (diện tích, cây trồng, hướng...) */
function getMutedClassName(isSelected = false) {
  return isSelected
    ? 'tracking-tight font-semibold text-white/80'
    : 'tracking-tight font-semibold text-slate-500';
}

/** Vạch phân cách mảnh giữa phần giá và phần thông tin */
function getDividerClassName(isSelected = false) {
  return isSelected
    ? 'inline-block w-px h-3 bg-white/40 shrink-0'
    : 'inline-block w-px h-2.5 bg-slate-300 shrink-0';
}

/** Cắt tên thửa cho vừa 1 dòng (span inline nên không dùng được utility `truncate`) */
export function truncateName(name = '', maxLength = 22) {
  const text = String(name || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Chip tin cậy (chỉ hiện khi thửa đang được chọn) */
const TRUST_CHIP_CLASS =
  'px-1.5 py-[1px] rounded-full bg-white/20 text-white text-[9px] font-bold tracking-tight';

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
  const priceStr = formatCompactPrice(properties);
  const facilities = properties.facilities || {};
  const firstCrop = Array.isArray(properties.crops) ? properties.crops[0] : '';

  const element = document.createElement('div');
  element.className = 'group relative z-10 hover:z-40 select-none pointer-events-auto animate-fadeInUp';
  element.style.animationDelay = `${Math.max(0, enterDelayMs)}ms`;

  const badge = document.createElement('div');
  badge.className = getBadgeClassName(properties, isSelected);

  // --- Các node con, tạo MỘT LẦN duy nhất ---
  const dot = document.createElement('span');
  dot.className = getDotClassName(properties, isSelected);
  dot.style.backgroundColor = isSelected ? '' : statusConfig.color;

  const idLabel = document.createElement('span');
  idLabel.className = 'tracking-tight';
  idLabel.textContent = properties.id || '';

  const separator = document.createElement('span');
  separator.className = 'opacity-50';
  separator.textContent = '•';

  const priceLabel = document.createElement('span');
  priceLabel.className = 'tracking-tight';
  priceLabel.textContent = priceStr || statusConfig.label;

  // --- Khối thông tin mở ra khi hover / khi được chọn ---
  const reveal = document.createElement('span');
  reveal.className = getRevealClassName(isSelected);

  const divider = document.createElement('span');
  divider.className = getDividerClassName(isSelected);

  const nameLabel = document.createElement('span');
  nameLabel.className = 'tracking-tight font-bold';
  nameLabel.textContent = truncateName(properties.name);

  const areaLabel = document.createElement('span');
  areaLabel.className = getMutedClassName(isSelected);
  areaLabel.textContent = properties.area || '';

  const cropLabel = document.createElement('span');
  cropLabel.className = getMutedClassName(isSelected);
  cropLabel.textContent = firstCrop || '';

  const directionLabel = document.createElement('span');
  directionLabel.className = getMutedClassName(isSelected);
  directionLabel.textContent = properties.direction || '';

  const statusLabel = document.createElement('span');
  statusLabel.className = getMutedClassName(isSelected);
  statusLabel.textContent = statusConfig.label;

  const trustChip = document.createElement('span');
  trustChip.className = TRUST_CHIP_CLASS;
  trustChip.textContent = 'VietGAP';

  // Micro-icon tiện ích — chỉ dựng node cho đúng 3 tiện ích cần khoe
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

  facilityWrap.appendChild(facIrrigation);
  facilityWrap.appendChild(facIot);
  facilityWrap.appendChild(facSoil);

  reveal.appendChild(divider);
  reveal.appendChild(nameLabel);
  reveal.appendChild(areaLabel);
  reveal.appendChild(cropLabel);
  reveal.appendChild(directionLabel);
  reveal.appendChild(statusLabel);
  reveal.appendChild(facilityWrap);
  reveal.appendChild(trustChip);

  const tail = document.createElement('span');
  tail.className = getTailClassName(properties, isSelected);

  badge.appendChild(dot);
  badge.appendChild(idLabel);
  badge.appendChild(separator);
  badge.appendChild(priceLabel);
  badge.appendChild(reveal);
  badge.appendChild(tail);
  element.appendChild(badge);

  const nodes = {
    dot,
    idLabel,
    separator,
    priceLabel,
    reveal,
    divider,
    nameLabel,
    areaLabel,
    cropLabel,
    directionLabel,
    statusLabel,
    trustChip,
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

  /**
   * Chỉ toggle class / hidden / textContent trên các node đã tồn tại.
   *  - Đang chọn      : mã thửa + tên + giá + diện tích + hướng + chip VietGAP
   *  - Trống, thu gọn : chấm + giá; hover hé diện tích + cây trồng + tiện ích
   *  - Đã thuê        : chấm + mã thửa; hover hé nhãn "Đã thuê" (vẫn giữ tông mờ)
   */
  function setSelected(selected) {
    const isSel = Boolean(selected);
    const vacant = isAvailableStatus(properties.status);

    badge.className = getBadgeClassName(properties, isSel);
    dot.className = getDotClassName(properties, isSel);
    dot.style.backgroundColor = isSel ? '' : statusConfig.color;
    tail.className = getTailClassName(properties, isSel);
    reveal.className = getRevealClassName(isSel);
    divider.className = getDividerClassName(isSel);

    const mutedClass = getMutedClassName(isSel);
    areaLabel.className = mutedClass;
    cropLabel.className = mutedClass;
    directionLabel.className = mutedClass;
    statusLabel.className = mutedClass;

    // Tiện ích: chỉ khoe ở thửa còn trống và chỉ khi dữ liệu thật có
    facIrrigation.hidden = !(vacant && facilities.irrigation);
    facIot.hidden = !(vacant && facilities.iot);
    facSoil.hidden = !(vacant && facilities.organicSoil);

    if (isSel) {
      idLabel.hidden = false;
      separator.hidden = false;
      priceLabel.hidden = false;
      priceLabel.textContent = priceStr || statusConfig.label;

      nameLabel.hidden = !properties.name;
      areaLabel.hidden = !properties.area;
      cropLabel.hidden = true;
      directionLabel.hidden = !properties.direction;
      statusLabel.hidden = vacant;
      trustChip.hidden = false;
    } else if (vacant) {
      idLabel.hidden = true;
      separator.hidden = true;
      priceLabel.hidden = false;
      priceLabel.textContent = priceStr;

      nameLabel.hidden = true;
      areaLabel.hidden = !properties.area;
      cropLabel.hidden = !firstCrop;
      directionLabel.hidden = true;
      statusLabel.hidden = true;
      trustChip.hidden = true;
    } else {
      idLabel.hidden = false;
      separator.hidden = true;
      priceLabel.hidden = true;

      nameLabel.hidden = true;
      areaLabel.hidden = true;
      cropLabel.hidden = true;
      directionLabel.hidden = true;
      statusLabel.hidden = false;
      trustChip.hidden = true;
    }
  }

  function destroy() {
    badge.removeEventListener('click', handleClick);
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  // Trạng thái hiển thị ban đầu
  setSelected(isSelected);

  return { element, badge, nodes, setSelected, destroy };
}
