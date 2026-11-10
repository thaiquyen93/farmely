import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportPanel } from './SupportPage';
import { supportApi } from '../../api/supportApi';
import { useAuthStore } from '../../stores/authStore';
import { AdminSupportRedirect } from '../../App';

vi.mock('../../api/supportApi', () => ({
  supportApi: {
    list: vi.fn(), related: vi.fn(), detail: vi.fn(), reply: vi.fn(), status: vi.fn(), assign: vi.fn(), upload: vi.fn(), image: vi.fn()
  }
}));

const ticket = { id: 7, customerId: 1, category: 'ACCOUNT', title: 'Kiểm tra CSKH', description: 'Cần giúp đỡ', status: 'NEW', updatedAt: '2026-11-10T00:00:00Z' };
const mount = async (node) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  await act(async () => { root.render(<MemoryRouter>{node}</MemoryRouter>); await Promise.resolve(); });
  return { host, unmount: async () => { await act(async () => root.unmount()); host.remove(); } };
};

beforeEach(() => {
  useAuthStore.setState({ user: { userId: 11, email: 'admin@farmely.vn', role: 'ADMIN' }, token: 'valid.jwt.token', isAuthenticated: true });
  supportApi.list.mockResolvedValue([ticket]);
  supportApi.related.mockResolvedValue({ assignees: [{ id: 11, name: 'Admin' }] });
  supportApi.detail.mockResolvedValue({ ticket, events: [], attachments: [] });
});

describe('CSKH trong dashboard admin', () => {
  it('mở chi tiết từ danh sách bằng callback, không tạo sidebar riêng', async () => {
    const onSelectTicket = vi.fn();
    const view = await mount(<SupportPanel admin onSelectTicket={onSelectTicket} />);
    expect(view.host.textContent).toContain('Kiểm tra CSKH');
    expect(view.host.querySelector('aside')).toBeNull();
    await act(async () => view.host.querySelector('button[class*="hover:bg-emerald-50"]').click());
    expect(onSelectTicket).toHaveBeenCalledWith(7);
    await view.unmount();
  });

  it('giữ các điều khiển phân công, trạng thái và phản hồi ở chi tiết', async () => {
    const view = await mount(<SupportPanel admin selectedTicketId="7" onBack={() => {}} />);
    expect(view.host.textContent).toContain('Kiểm tra CSKH');
    expect(view.host.textContent).toContain('Người xử lý');
    expect(view.host.textContent).toContain('Chuyển sang Đang xử lý');
    expect(view.host.textContent).toContain('Gửi phản hồi');
    await view.unmount();
  });
});

function LocationResult() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }

describe('link CSKH cũ', () => {
  it.each([
    ['/admin/support', '/admin/dashboard?tab=support'],
    ['/admin/support/7', '/admin/dashboard?tab=support&ticket=7']
  ])('%s chuyển về tab dashboard', async (from, expected) => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const root = ReactDOM.createRoot(host);
    await act(async () => root.render(<MemoryRouter initialEntries={[from]}><Routes><Route path="/admin/support" element={<AdminSupportRedirect />} /><Route path="/admin/support/:id" element={<AdminSupportRedirect />} /><Route path="/admin/dashboard" element={<LocationResult />} /></Routes></MemoryRouter>));
    expect(host.textContent).toBe(expected);
    await act(async () => root.unmount()); host.remove();
  });
});
