import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import FieldWorkerDashboard from './FieldWorkerDashboard';
import { useAuthStore } from '../../stores/authStore';
import { getNotificationsForUser } from '../../services/notificationService';

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
      if (url.includes('open-meteo.com')) {
        return new Response(JSON.stringify({
          current: {
            temperature_2m: 28.5,
            relative_humidity_2m: 74,
            soil_moisture_0_to_1cm: 0.45,
            direct_radiation: 375,
            soil_temperature_0cm: 28.0,
            precipitation: 0.0,
            wind_speed_10m: 6.2,
            surface_pressure: 1010
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
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

    // Renders as an inline page (not a dialog modal) with back navigation and a tasks table
    expect(findButton('Quay lại danh sách thửa đất')).toBeTruthy();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    const taskTable = host.querySelector('table');
    expect(taskTable).not.toBeNull();
    expect(taskTable.textContent).toContain('Mã CV');
    expect(taskTable.textContent).toContain('Tên Công Việc');
    expect(taskTable.textContent).toContain('Hạn / Thời Gian');

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

    // Tab Hôm nay chỉ giữ việc đến hạn hôm nay, việc quá hạn chuyển sang tab Quá hạn riêng
    await click(findButton('Hôm nay'));
    expect(text()).toContain('Tưới nước hôm nay');
    expect(text()).not.toContain('Làm cỏ quá hạn');

    await click(findButton('Quá hạn'));
    expect(text()).toContain('Làm cỏ quá hạn');
    expect(text()).not.toContain('Tưới nước hôm nay');

    await click(findButton('Tất cả'));

    for (const label of ['Thời Tiết & Khí Tượng', 'Yêu cầu dịch vụ', 'Thu hoạch', 'Công việc']) {
      const tab = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes(label)).pop();
      expect(tab, label).toBeTruthy();
      await click(tab);
      if (label === 'Thời Tiết & Khí Tượng') {
        expect(text()).toContain('Độ ẩm không khí');
        expect(text()).not.toContain('Độ pH đất');
      }
    }
    expect(text()).toContain('Tưới nước hôm nay');
  }, 15000);

  it('does not auto-complete PENDING harvest task from legacy fake harvest seed, keeps handover task in Today, and notifies customer on completion', async () => {
    localStorage.clear();
    const newRental = {
      rentalId: 11,
      renterId: 101,
      customerId: 101,
      plotCode: 'P-10',
      plotName: 'Thửa P-10',
      status: 'ACTIVE',
      crop: 'Xà lách Romaine',
      currentDay: 0,
      totalDays: 45
    };
    const newTasks = [
      {
        taskId: 58,
        rentalId: 11,
        customerId: 101,
        plotCode: 'P-10',
        stepOrder: 0,
        cropDay: 0,
        plotCurrentDay: 0,
        title: 'Khởi tạo và bàn giao thửa đất cho mùa vụ mới',
        dueDate: ymd(0),
        status: 'PENDING',
        instructions: 'Làm đất, bón lót và kiểm tra IoT.'
      },
      {
        taskId: 65,
        rentalId: 11,
        customerId: 101,
        plotCode: 'P-10',
        stepOrder: 8,
        cropDay: 43,
        plotCurrentDay: 0,
        title: 'Thu hoạch & Đóng gói',
        dueDate: ymd(43),
        status: 'PENDING',
        instructions: 'Thu hoạch cuối vụ.'
      }
    ];
    const fakeAutoHarvestRow = {
      harvestId: 9,
      rentalId: 11,
      plotCode: 'P-10',
      yieldAmount: 52.5,
      deliveryType: 'DELIVERY',
      customerConfirmed: false,
      evidenceImageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80'
    };

    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input);
      if (url.includes('/api/rentals')) return respond([newRental]);
      if (url.includes('/api/tasks/') && url.includes('/complete') && init?.method === 'PUT') {
        return new Response(JSON.stringify({
          success: true,
          data: { task_id: 58, rental_id: 11, status: 'DONE' },
          notification: {
            notificationId: 777,
            userId: 101,
            title: '✅ Hoàn thành công việc tại thửa P-10',
            content: 'Nhân viên đã hoàn thành "Khởi tạo và bàn giao thửa đất cho mùa vụ mới" tại thửa P-10.',
            isRead: false
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/tasks')) return respond(newTasks);
      if (url.includes('/api/harvest')) return respond([fakeAutoHarvestRow]);
      return respond([]);
    }));

    await act(async () => root.render(<MemoryRouter initialEntries={['/staff/dashboard?plot=P-10']}><FieldWorkerDashboard /></MemoryRouter>));
    await flush();

    // Auto-opens P-10 from ?plot=P-10, keeps 0 completed tasks, shows handover task under Today
    expect(document.body.textContent).toContain('Khởi tạo và bàn giao thửa đất cho mùa vụ mới');
    expect(document.body.textContent).toContain('Đã hoàn thành0');

    await click(findButton('Hôm nay'));
    expect(document.body.textContent).not.toContain('Đã hoàn thành hôm nay');
    expect(document.body.textContent).toContain('Khởi tạo và bàn giao thửa đất cho mùa vụ mới');

    // Complete handover task -> sends live notification for customer userId 101
    await click(findButton('Xong việc'));
    await flush();
    const noteArea = document.querySelector('textarea');
    expect(noteArea).toBeTruthy();

    // Inject mock photo into file input via DataTransfer/File or FileReader mock so submit passes
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const origFR = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          this.result = 'data:image/png;base64,iVBORw0KGgo=';
          this.onload?.({ target: { result: this.result } });
        }, 0);
      }
    };
    const file = new File(['img'], 'proof.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 20));
    });
    globalThis.FileReader = origFR;

    const submitBtn = [...document.querySelectorAll('button[type="submit"]')].find((b) => /Hoàn tất|Xác nhận|Báo cáo xong/i.test(b.textContent));
    expect(submitBtn).toBeTruthy();
    await click(submitBtn);
    await flush();

    const customerNotifs = getNotificationsForUser({ userId: 101, role: 'CUSTOMER' });
    expect(customerNotifs.some((n) => n.title.includes('Hoàn thành công việc tại thửa P-10'))).toBe(true);
  }, 15000);
});
