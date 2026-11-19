import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { apiFetch } from '../../api/apiClient';
import { siteVisitsService } from '../../api/siteVisitsService';
import { useAuthStore } from '../../stores/authStore';

vi.mock('../../api/apiClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiFetch: vi.fn()
  };
});

vi.mock('../../api/siteVisitsService', () => ({
  siteVisitsService: {
    getAll: vi.fn()
  }
}));

const seedUsers = [
  { userId: 11, fullName: 'Ban Quản Trị Farmely', email: 'admin@farmely.vn', role: 'ADMIN', status: 'ACTIVE' },
  { userId: 5, fullName: 'ThS. Nguyễn Hoàng Nam', email: 'expert@farmely.vn', role: 'EXPERT', status: 'ACTIVE' },
  { userId: 8, fullName: 'Trần Văn Lực', email: 'worker@farmely.vn', role: 'STAFF', status: 'ACTIVE' },
  { userId: 1, fullName: 'Lô Thái Quyền', email: 'customer@farmely.vn', role: 'CUSTOMER', status: 'ACTIVE' }
];

let dbUsers = [];

const mountUsersTab = async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/admin/dashboard?tab=users']}>
        <AdminDashboard />
      </MemoryRouter>
    );
    await Promise.resolve();
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  return {
    host,
    unmount: async () => {
      await act(async () => root.unmount());
      host.remove();
    }
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  dbUsers = seedUsers.map((u) => ({ ...u }));
  useAuthStore.setState({
    user: { userId: 11, id: 'USR-004', fullName: 'Ban Quản Trị Farmely', email: 'admin@farmely.vn', role: 'ADMIN' },
    token: 'farmely-jwt-token-11-test',
    isAuthenticated: true
  });
  siteVisitsService.getAll.mockResolvedValue([]);
  apiFetch.mockImplementation(async (url, opts) => {
    if (url === '/api/users') {
      return [...dbUsers];
    }
    const roleMatch = String(url).match(/^\/api\/users\/(\d+)\/role/);
    if (roleMatch && opts?.method === 'PATCH') {
      const targetId = Number(roleMatch[1]);
      const payload = JSON.parse(opts.body || '{}');
      dbUsers = dbUsers.map((u) => (u.userId === targetId ? { ...u, role: payload.role } : u));
      return { success: true, data: dbUsers.find((u) => u.userId === targetId) };
    }
    if (url.startsWith('/api/audit-logs/overview')) {
      return { data: { totalLogs: 0, loginsCount: 0, passwordResetsCount: 0, roleChangesCount: 0 } };
    }
    if (url.startsWith('/api/alerts/overview')) {
      return { data: {} };
    }
    if (url.startsWith('/api/weather/current') || url.startsWith('/api/admin/analytics')) {
      return { data: null };
    }
    return { data: [] };
  });
});

describe('AdminDashboard RBAC role assignment', () => {
  it('hiển thị 4 vai trò ADMIN, EXPERT, STAFF, CUSTOMER và cho phép phân quyền lại tài khoản', async () => {
    const view = await mountUsersTab();
    expect(view.host.textContent).toContain('Quản Trị Người Dùng & Phân Quyền (RBAC)');
    expect(view.host.textContent).toContain('ADMIN');
    expect(view.host.textContent).toContain('EXPERT');
    expect(view.host.textContent).toContain('STAFF');
    expect(view.host.textContent).toContain('CUSTOMER');

    // Tìm hàng của khách hàng Lô Thái Quyền và bấm "Phân quyền"
    const customerRow = Array.from(view.host.querySelectorAll('tbody tr')).find((tr) =>
      tr.textContent.includes('customer@farmely.vn')
    );
    expect(customerRow).toBeTruthy();

    const assignBtn = Array.from(customerRow.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Phân quyền')
    );
    expect(assignBtn).toBeTruthy();

    await act(async () => {
      assignBtn.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('Phân Quyền Tài Khoản (RBAC)');

    // Chọn radio EXPERT trong modal
    const expertRadio = document.body.querySelector('input[type="radio"][name="rbacRole"][value="EXPERT"]');
    expect(expertRadio).toBeTruthy();
    await act(async () => {
      expertRadio.click();
      await Promise.resolve();
    });

    const saveBtn = Array.from(document.body.querySelectorAll('button[type="submit"]')).find((b) =>
      b.textContent.includes('Lưu Phân Quyền')
    );
    expect(saveBtn).toBeTruthy();

    await act(async () => {
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 30));
    });

    const patchCall = apiFetch.mock.calls.find(([u, o]) => u === '/api/users/1/role' && o?.method === 'PATCH');
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(patchCall[1].body).role).toBe('EXPERT');

    const updatedRow = Array.from(view.host.querySelectorAll('tbody tr')).find((tr) =>
      tr.textContent.includes('customer@farmely.vn')
    );
    expect(updatedRow.textContent).toContain('(EXPERT)');

    await view.unmount();
  });

  it('không cho phép hạ quyền Quản Trị Viên hoạt động cuối cùng', async () => {
    const view = await mountUsersTab();
    const adminRow = Array.from(view.host.querySelectorAll('tbody tr')).find((tr) =>
      tr.textContent.includes('admin@farmely.vn')
    );
    expect(adminRow).toBeTruthy();

    const assignBtn = Array.from(adminRow.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Phân quyền')
    );
    await act(async () => {
      assignBtn.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('Quản Trị Viên đang hoạt động duy nhất');
    const customerRadio = document.body.querySelector('input[type="radio"][name="rbacRole"][value="CUSTOMER"]');
    expect(customerRadio.disabled).toBe(true);

    await view.unmount();
  });
});

