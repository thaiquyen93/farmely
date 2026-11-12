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
    list: vi.fn(), create: vi.fn(), detail: vi.fn(), reply: vi.fn(), status: vi.fn(), upload: vi.fn(), image: vi.fn()
  }
}));

const ticket = { id: 7, customerId: 1, customerName: 'Lô Thái Quyên', customerEmail: 'quyen@example.com', category: 'ACCOUNT', title: 'Kiểm tra CSKH', description: 'Cần giúp đỡ', status: 'NEW', createdAt: '2026-11-10T00:00:00Z' };
const mount = async (node, initialEntry = '/') => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  await act(async () => { root.render(<MemoryRouter initialEntries={[initialEntry]}>{node}</MemoryRouter>); await Promise.resolve(); });
  return { host, unmount: async () => { await act(async () => root.unmount()); host.remove(); } };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: { userId: 11, email: 'admin@farmely.vn', role: 'ADMIN' }, token: 'valid.jwt.token', isAuthenticated: true });
  supportApi.list.mockResolvedValue([ticket]);
  supportApi.detail.mockResolvedValue({ ticket, events: [], attachments: [] });
  supportApi.status.mockResolvedValue({ ...ticket, status: 'RESPONDED' });
  supportApi.create.mockResolvedValue(ticket);
});

describe('CSKH trong dashboard admin', () => {
  it('mở chi tiết từ danh sách bằng callback, không tạo sidebar riêng', async () => {
    const onSelectTicket = vi.fn();
    const view = await mount(<SupportPanel admin onSelectTicket={onSelectTicket} />);
    expect(view.host.textContent).toContain('Cần giúp đỡ');
    expect(view.host.querySelector('aside')).toBeNull();
    expect(view.host.textContent).toContain('Lô Thái Quyên');
    await act(async () => view.host.querySelector('tbody button').click());
    expect(onSelectTicket).toHaveBeenCalledWith(7);
    await view.unmount();
  });

  it('cho phép đổi trạng thái trên danh sách và làm mới dữ liệu', async () => {
    const view = await mount(<SupportPanel admin />);
    const select = view.host.querySelector('select[aria-label="Đổi trạng thái yêu cầu #7"]');
    await act(async () => { select.value = 'RESPONDED'; select.dispatchEvent(new Event('change', { bubbles: true })); await Promise.resolve(); });
    expect(supportApi.status).toHaveBeenCalledWith(7, 'RESPONDED');
    expect(supportApi.list.mock.calls.length).toBeGreaterThanOrEqual(2);
    await view.unmount();
  });

  it('hiện ô trả lời và thông tin khách, không hiện phân công hay lịch sử', async () => {
    const view = await mount(<SupportPanel admin selectedTicketId="7" onBack={() => {}} />);
    expect(view.host.textContent).toContain('Kiểm tra CSKH');
    expect(view.host.textContent).toContain('Lô Thái Quyên');
    expect(view.host.textContent).not.toContain('Người xử lý');
    expect(view.host.textContent).not.toContain('Lịch sử trao đổi');
    expect(view.host.textContent).toContain('Gửi phản hồi');
    await view.unmount();
  });
});

describe('Hỗ trợ khách hàng', () => {
  beforeEach(() => useAuthStore.setState({ user: { userId: 1, email: 'customer@farmely.vn', role: 'CUSTOMER' }, token: 'valid.jwt.token', isAuthenticated: true }));

  it('chỉ gửi danh mục và mô tả, tiêu đề do hệ thống tạo', async () => {
    const view = await mount(<SupportPanel />);
    expect(view.host.textContent).toContain('Tiêu đề:');
    expect(view.host.textContent).not.toContain('Tiêu đề tự tạo');
    expect(view.host.textContent).not.toContain('Thửa đất liên quan');
    const textarea = view.host.querySelector('textarea');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, 'Tôi cần hỗ trợ'); textarea.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { view.host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });
    expect(supportApi.create).toHaveBeenCalledWith({ category: 'ACCOUNT', description: 'Tôi cần hỗ trợ' });
    await view.unmount();
  });

  it('hiện phản hồi admin trong chi tiết', async () => {
    supportApi.detail.mockResolvedValue({ ticket: { ...ticket, status: 'RESPONDED' }, events: [{ id: 1, type: 'REPLY', actorRole: 'ADMIN', body: 'Đã kiểm tra', createdAt: ticket.createdAt }], attachments: [] });
    const view = await mount(<Routes><Route path="/customer/support/:id" element={<SupportPanel/>}/></Routes>, '/customer/support/7');
    expect(view.host.textContent).toContain('Đã kiểm tra');
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
