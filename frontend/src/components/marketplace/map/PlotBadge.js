/**
 * PLOT BADGE — Factory tạo badge giá nổi trên tâm mỗi thửa đất (phong cách Airbnb).
 *
 * Điểm quan trọng: các node con (chấm trạng thái, mã thửa, giá) được tạo MỘT LẦN
 * trong factory. setSelected chỉ bật/tắt class trên đúng các node đó —
 * KHÔNG gán lại innerHTML, vì gán innerHTML sẽ phá mọi CSS transition đang chạy.
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
  'w-max whitespace-nowrap inline-flex items-center cursor-pointer select-none pointer-events-auto transition-all duration-300 ease-out';

/** Class của khung badge theo trạng thái + có đang được chọn hay không */
export function getBadgeClassName(props = {}, isSelected = false) {
  if (isSelected) {
    return `${BASE_CLASS} gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-emerald-600 text-white shadow-xl shadow-emerald-950/40 border-2 border-white scale-110 ring-2 ring-emerald-400 z-30 font-extrabold`;
  }

  if (isAvailableStatus(props.status)) {
    // Thửa CÒN TRỐNG: badge giá siêu gọn, không tràn lấn thửa bên cạnh
    return `${BASE_CLASS} gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/95 text-slate-900 border border-emerald-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-110 hover:border-emerald-500 hover:shadow-lg hover:z-20 font-extrabold`;
  }

  // Thửa ĐÃ THUÊ: tag khiêm tốn, tối mờ, chìm dưới nền
  return `${BASE_CLASS} gap-1 px-1.5 py-0.5 rounded-full text-[9px] bg-slate-900/70 text-slate-400 border border-slate-700/60 shadow-sm opacity-60 hover:opacity-100 hover:scale-105 font-medium`;
}

/** Class của chấm trạng thái */
function getDotClassName(props = {}, isSelected = false) {
  if (isSelected) {
    return 'rounded-full shrink-0 transition-all duration-300 w-1.5 h-1.5 bg-white animate-ping';
  }
  if (isAvailableStatus(props.status)) {
    return 'rounded-full shrink-0 transition-all duration-300 w-1.5 h-1.5';
  }
  return 'rounded-full shrink-0 transition-all duration-300 w-1 h-1 opacity-80';
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
  const priceStr = formatCompactPrice(properties);

  const element = document.createElement('div');
  element.className = 'select-none pointer-events-auto animate-fadeInUp';
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

  badge.appendChild(dot);
  badge.appendChild(idLabel);
  badge.appendChild(separator);
  badge.appendChild(priceLabel);
  element.appendChild(badge);

  const nodes = { dot, idLabel, separator, priceLabel };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(properties);
  };
  badge.addEventListener('click', handleClick);

  /**
   * Chỉ toggle class / hidden trên các node đã tồn tại.
   * Khi KHÔNG được chọn: thửa trống chỉ hiện chấm + giá; thửa đã thuê hiện chấm + mã thửa.
   */
  function setSelected(selected) {
    const isSel = Boolean(selected);
    const vacant = isAvailableStatus(properties.status);

    badge.className = getBadgeClassName(properties, isSel);
    dot.className = getDotClassName(properties, isSel);
    dot.style.backgroundColor = isSel ? '' : statusConfig.color;

    if (isSel) {
      idLabel.hidden = false;
      separator.hidden = false;
      priceLabel.hidden = false;
      priceLabel.textContent = priceStr || statusConfig.label;
    } else if (vacant) {
      idLabel.hidden = true;
      separator.hidden = true;
      priceLabel.hidden = false;
      priceLabel.textContent = priceStr;
    } else {
      idLabel.hidden = false;
      separator.hidden = true;
      priceLabel.hidden = true;
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
