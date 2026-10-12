import { describe, it, expect, vi } from 'vitest';
import { createPlotBadge, formatCompactPrice, getBadgeClassName } from './PlotBadge';

const vacantProps = {
  id: 'P-01',
  status: 'Đang trống',
  rentalPrice: 1200000,
  price: '1.200.000 đ',
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

  it('never emits Tailwind v4-only or out-of-scale utilities', () => {
    [getBadgeClassName(vacantProps, true), getBadgeClassName(vacantProps, false), getBadgeClassName(rentedProps, false)]
      .forEach((cls) => {
        expect(cls).not.toContain('shadow-xs');
        expect(cls).not.toContain('shadow-2xs');
        expect(cls).not.toContain('scale-115');
        expect(cls).not.toContain('font-black');
      });
  });
});
