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

const mockServices = [
  {
    id: 'DISP-1',
    requestId: 1,
    rentalId: 1,
    serviceName: 'Tưới nước bổ sung',
    plotCode: 'P-01',
    plotName: 'Thửa P-01',
    customerName: 'Lô Thái Quyền',
    customerPhone: '0901234567',
    scheduledDate: '2026-11-07',
    price: 25000,
    status: 'PENDING',
    notes: 'Tưới nước sáng sớm'
  },
  {
    id: 'DISP-2',
    requestId: 2,
    rentalId: 1,
    serviceName: 'Bón phân theo giai đoạn',
    plotCode: 'P-01',
    plotName: 'Thửa P-01',
    customerName: 'Lô Thái Quyền',
    customerPhone: '0901234567',
    scheduledDate: '2026-11-05',
    price: 60000,
    status: 'DONE',
    notes: 'Bón phân hữu cơ vi sinh'
  }
];

const respond = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });

const flush = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('FieldWorkerDashboard Service Requests Table', () => {
  let host;
  let root;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const url = String(input);
      if (url.includes('/api/rentals')) return respond([]);
      if (url.includes('/api/tasks')) return respond([]);
      if (url.includes('/api/issues')) return respond([]);
      if (url.includes('/api/harvest')) return respond([]);
      if (url.includes('/api/services/requests')) return respond(mockServices);
      if (url.includes('open-meteo.com')) {
        return new Response(JSON.stringify({ current: { temperature_2m: 26 } }));
      }
      return respond([]);
    }));
    useAuthStore.setState({ user: staff, token: 'mock-token' });
    host = document.createElement('div');
    document.body.appendChild(host);
    root = ReactDOM.createRoot(host);
  });

  afterEach(() => {
    act(() => { root?.unmount(); });
    host?.remove();
    vi.restoreAllMocks();
  });

  it('renders service requests in a table with basic info and no customer notes', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/staff/dashboard']}>
          <FieldWorkerDashboard />
        </MemoryRouter>
      );
    });
    await flush();

    // Click on "Yêu cầu dịch vụ" tab
    const servicesNavBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent.includes('Yêu cầu dịch vụ')
    );
    expect(servicesNavBtn).toBeDefined();
    await click(servicesNavBtn);
    await flush();

    // Verify table structure
    const table = host.querySelector('table');
    expect(table).not.toBeNull();

    // Verify headers
    const ths = [...table.querySelectorAll('th')].map((th) => th.textContent.trim());
    expect(ths).toContain('Mã YC');
    expect(ths).toContain('Thửa Đất');
    expect(ths).toContain('Tên Dịch Vụ');
    expect(ths).toContain('Khách Hàng');
    expect(ths).toContain('Lịch Hẹn');
    expect(ths).toContain('Giá Tiền');
    expect(ths).toContain('Trạng Thái');
    expect(ths).toContain('Thao Tác');

    // Verify rows contain basic info
    const tbody = table.querySelector('tbody');
    expect(tbody.textContent).toContain('DISP-1');
    expect(tbody.textContent).toContain('Tưới nước bổ sung');
    expect(tbody.textContent).toContain('Lô Thái Quyền');
    expect(tbody.textContent).toContain('25.000 đ');

    expect(tbody.textContent).toContain('DISP-2');
    expect(tbody.textContent).toContain('Bón phân theo giai đoạn');
    expect(tbody.textContent).toContain('60.000 đ');

    // Crucial check: NO customer notes ("Ghi chú của khách hàng" or notes content) in the table
    expect(tbody.textContent).not.toContain('Ghi chú của khách hàng');
    expect(tbody.textContent).not.toContain('Tưới nước sáng sớm');
    expect(tbody.textContent).not.toContain('Bón phân hữu cơ vi sinh');
  });
});

