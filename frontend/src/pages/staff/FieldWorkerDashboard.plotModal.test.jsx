import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import FieldWorkerDashboard from './FieldWorkerDashboard';
import { useAuthStore } from '../../stores/authStore';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const staff = { id: '8', userId: '8', role: 'STAFF', fullName: 'Test staff', email: 'worker@farmely.vn' };

const ymd = (offsetDays) => {
  const base = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const [y, m, d] = base.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return date.toISOString().slice(0, 10);
};

const rental = { rentalId: 7, plotCode: 'P-07', plotName: 'Thửa kiểm thử', status: 'ACTIVE', crop: 'Cải xanh' };
const task = (id, extra) => ({ taskId: id, rentalId: 7, plotCode: 'P-07', deadline: '08:00', instructions: `Mô tả việc ${id}`, ...extra });
const apiTasks = [
  task(1, { title: 'Tưới nước hôm nay', dueDate: ymd(0), status: 'PENDING' }),
  task(2, { title: 'Làm cỏ quá hạn', dueDate: ymd(-2), status: 'PENDING', isOverdue: true }),
  task(3, { title: 'Bón phân sắp tới', dueDate: ymd(3), status: 'PENDING' }),
  task(4, { title: 'Phun thuốc đã xong', dueDate: ymd(-1), status: 'COMPLETED' })
];

const respond = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });

const flush = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const findButton = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(text));

describe('FieldWorkerDashboard plot modal', () => {
  let host;
  let root;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const url = String(input);
      if (url.includes('/api/rentals')) return respond([rental]);
      if (url.includes('/api/tasks')) return respond(apiTasks);
      return respond([]);
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAuthStore.setState({ user: staff, isAuthenticated: true });
    host = document.createElement('div');
    document.body.appendChild(host);
    root = ReactDOM.createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the task agenda and every sub-tab without crashing', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={['/staff/dashboard']}><FieldWorkerDashboard /></MemoryRouter>));
    await flush();

    // Sidebar badge counts only today/overdue work (2), not upcoming.
    const navItem = findButton('Thửa đất phụ trách');
    expect(navItem).toBeTruthy();
    expect(navItem.textContent).toContain('2');

    const plotCard = [...host.querySelectorAll('.cursor-pointer')].find((el) => el.textContent.includes('P-07'));
    expect(plotCard).toBeTruthy();
    await click(plotCard);

    const text = () => document.body.textContent;
    expect(text()).toContain('Tưới nước hôm nay');
    expect(text()).toContain('Làm cỏ quá hạn');
    expect(text()).toContain('Bón phân sắp tới');
    // Overdue task keeps its original due date in the meta line.
    expect(text()).toContain('Hạn ');
    // Completed section is collapsed by default.
    expect(text()).toContain('Đã hoàn thành (1)');
    expect(text()).not.toContain('Phun thuốc đã xong');

    // Card title is a real button and is the detail trigger; action buttons are not nested in it.
    const titleButton = [...document.querySelectorAll('button.task-detail-trigger')].find((b) => b.textContent.includes('Tưới nước hôm nay'));
    expect(titleButton).toBeTruthy();
    expect(titleButton.querySelector('button')).toBeNull();
    expect(titleButton.closest('[role="button"]')).toBeNull();

    await click(findButton('Đã hoàn thành (1)'));
    expect(text()).toContain('Phun thuốc đã xong');

    for (const label of ['Thời Tiết & Khí Tượng', 'Yêu cầu dịch vụ', 'Thu hoạch', 'Công việc']) {
      const tab = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes(label)).pop();
      expect(tab, label).toBeTruthy();
      await click(tab);
      if (label === 'Thời Tiết & Khí Tượng') {
        expect(text()).toContain('Độ ẩm không khí');
        expect(text()).not.toContain('Lượng mưa');
      }
    }
    expect(text()).toContain('Tưới nước hôm nay');
  });
});
