import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import {
  createPlotBadge,
  formatCompactPrice,
  getBadgeClassName,
  getTailClassName,
  truncateName,
} from './PlotBadge';

const vacantProps = {
  id: 'P-01',
  status: 'Đang trống',
  rentalPrice: 1200000,
  price: '1.200.000 đ',
};

const richVacantProps = {
  ...vacantProps,
  name: 'Thửa Ruộng Bậc Thang P-01',
  area: '150 m²',
  direction: 'Đông Nam',
  crops: ['🌶️ Ớt chuông', '🍆 Cà tím'],
  facilities: { irrigation: true, iot: true, organicSoil: false, waterSource: true },
};

const rentedProps = { id: 'P-05', status: 'Đã thuê', rentalPrice: 1450000 };

describe('formatCompactPrice', () => {
  it('shortens millions the Airbnb way', () => {
    expect(formatCompactPrice({ rentalPrice: 1200000 })).toBe('1.2 tr');
    expect(formatCompactPrice({ rentalPrice: 2000000 })).toBe('2 tr');
    expect(formatCompactPrice({ rentalPrice: 1450000 })).toBe('1.45 tr');
  });

  it('falls back to the formatted price string', () => {
    expect(formatCompactPrice({ price: '1.200.000 đ' })).toBe('1.2 tr');
  });

  it('returns an empty string when there is no price', () => {
    expect(formatCompactPrice({})).toBe('');
    expect(formatCompactPrice()).toBe('');
  });
});

describe('createPlotBadge', () => {
  it('builds the child nodes ONCE — toggling selection must not rebuild them', () => {
    const badge = createPlotBadge({ properties: vacantProps });
    const { dot, idLabel, priceLabel } = badge.nodes;

    badge.setSelected(true);
    badge.setSelected(false);
    badge.setSelected(true);

    // Same object identities => no innerHTML reassignment happened
    expect(badge.nodes.dot).toBe(dot);
    expect(badge.nodes.idLabel).toBe(idLabel);
    expect(badge.nodes.priceLabel).toBe(priceLabel);
    expect(badge.badge.contains(dot)).toBe(true);
    expect(badge.badge.contains(idLabel)).toBe(true);
    expect(badge.badge.contains(priceLabel)).toBe(true);
  });

  it('toggles the expected classes between selected and unselected', () => {
    const badge = createPlotBadge({ properties: vacantProps });

    badge.setSelected(true);
    expect(badge.badge.className).toContain('bg-emerald-600');
    expect(badge.badge.className).toContain('scale-110');
    expect(badge.nodes.idLabel.hidden).toBe(false);

    badge.setSelected(false);
    expect(badge.badge.className).not.toContain('bg-emerald-600');
    expect(badge.badge.className).toContain('bg-white/95');
    // vacant + unselected shows only the compact price
    expect(badge.nodes.idLabel.hidden).toBe(true);
    expect(badge.nodes.priceLabel.hidden).toBe(false);
    expect(badge.nodes.priceLabel.textContent).toBe('1.2 tr');
  });

  it('shows the plot id (not the price) for rented plots when unselected', () => {
    const badge = createPlotBadge({ properties: rentedProps });
    expect(badge.nodes.idLabel.hidden).toBe(false);
    expect(badge.nodes.idLabel.textContent).toBe('P-05');
    expect(badge.nodes.priceLabel.hidden).toBe(true);
  });

  it('applies the stagger delay as an inline animationDelay', () => {
    const badge = createPlotBadge({ properties: vacantProps, enterDelayMs: 165 });
    expect(badge.element.className).toContain('animate-fadeInUp');
    expect(badge.element.style.animationDelay).toBe('165ms');
  });

  it('forwards clicks with the plot properties and stops after destroy', () => {
    const onClick = vi.fn();
    const badge = createPlotBadge({ properties: vacantProps, onClick });

    badge.badge.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledWith(vacantProps);

    badge.destroy();
    badge.badge.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the collapsed tier compact but ships the hover-reveal nodes', () => {
    const badge = createPlotBadge({ properties: richVacantProps });
    const { reveal, areaLabel, cropLabel, facIrrigation, facIot, facSoil, tail } = badge.nodes;

    // Khối reveal tồn tại và chỉ mở bằng CSS (group-hover), không listener JS
    expect(badge.element.className).toContain('group');
    expect(reveal.className).toContain('max-w-0');
    expect(reveal.className).toContain('group-hover:max-w-[240px]');
    expect(badge.badge.contains(reveal)).toBe(true);

    // Thông tin thật được nạp sẵn vào DOM
    expect(areaLabel.textContent).toBe('150 m²');
    expect(areaLabel.hidden).toBe(false);
    expect(cropLabel.textContent).toBe('🌶️ Ớt chuông');
    expect(cropLabel.hidden).toBe(false);

    // Micro-icon tiện ích theo đúng dữ liệu
    expect(facIrrigation.hidden).toBe(false);
    expect(facIot.hidden).toBe(false);
    expect(facSoil.hidden).toBe(true);

    // Mũi neo xuống thửa đất
    expect(badge.badge.contains(tail)).toBe(true);
    expect(tail.className).toContain('rotate-45');
  });

  it('reveals the rich selected tier and keeps every node reference stable', () => {
    const badge = createPlotBadge({ properties: richVacantProps });
    const refs = { ...badge.nodes };

    badge.setSelected(true);

    expect(badge.badge.className).toContain('animate-pulseGlow');
    expect(badge.nodes.reveal.className).toContain('max-w-[320px]');
    expect(badge.nodes.nameLabel.hidden).toBe(false);
    expect(badge.nodes.directionLabel.textContent).toBe('Đông Nam');
    expect(badge.nodes.directionLabel.hidden).toBe(false);
    expect(badge.nodes.trustChip.hidden).toBe(false);
    expect(badge.nodes.areaLabel.hidden).toBe(false);

    badge.setSelected(false);
    expect(badge.nodes.trustChip.hidden).toBe(true);
    expect(badge.nodes.nameLabel.hidden).toBe(true);

    // Không node nào bị dựng lại => không có innerHTML nào được gán
    Object.keys(refs).forEach((key) => {
      expect(badge.nodes[key]).toBe(refs[key]);
      expect(badge.badge.contains(badge.nodes[key])).toBe(true);
    });
  });

  it('truncates long plot names instead of relying on a block-level utility', () => {
    expect(truncateName('Thửa Ruộng Bậc Thang P-01')).toBe('Thửa Ruộng Bậc Thang…');
    expect(truncateName('P-01')).toBe('P-01');
    expect(truncateName()).toBe('');
  });

  it('keeps rented plots in the quiet treatment with a hover-only status label', () => {
    const badge = createPlotBadge({ properties: rentedProps });

    expect(badge.badge.className).toContain('opacity-60');
    expect(badge.badge.className).toContain('bg-slate-900/70');
    expect(badge.badge.className).not.toContain('bg-white/95');

    // Nhãn trạng thái nằm trong khối reveal => chỉ thấy khi hover
    expect(badge.nodes.statusLabel.hidden).toBe(false);
    expect(badge.nodes.statusLabel.textContent).toBe('Đã thuê');
    expect(badge.nodes.reveal.contains(badge.nodes.statusLabel)).toBe(true);
    expect(badge.nodes.reveal.className).toContain('max-w-0');

    // Không khoe tiện ích / chip tin cậy cho thửa đã thuê
    expect(badge.nodes.facIrrigation.hidden).toBe(true);
    expect(badge.nodes.facIot.hidden).toBe(true);
    expect(badge.nodes.trustChip.hidden).toBe(true);
  });

  it('never assigns innerHTML anywhere in the factory source', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/marketplace/map/PlotBadge.js'),
      'utf8'
    );
    // Chỉ cấm phép GÁN innerHTML (chuỗi trong comment giải thích vẫn được)
    expect(source).not.toMatch(/innerHTML\s*=/);
    expect(source).not.toMatch(/insertAdjacentHTML/);
  });

  it('never emits Tailwind v4-only or out-of-scale utilities', () => {
    [
      getBadgeClassName(vacantProps, true),
      getBadgeClassName(vacantProps, false),
      getBadgeClassName(rentedProps, false),
      getTailClassName(vacantProps, true),
      getTailClassName(vacantProps, false),
      getTailClassName(rentedProps, false),
    ].forEach((cls) => {
      expect(cls).not.toContain('shadow-xs');
      expect(cls).not.toContain('shadow-2xs');
      expect(cls).not.toContain('backdrop-blur-xs');
      expect(cls).not.toContain('scale-115');
      expect(cls).not.toContain('font-black');
    });
  });
});
