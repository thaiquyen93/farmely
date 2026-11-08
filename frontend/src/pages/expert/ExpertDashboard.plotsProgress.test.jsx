import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExpertDashboard from './ExpertDashboard';
import * as apiClient from '../../api/apiClient';
import { useAuthStore } from '../../stores/authStore';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);

  useAuthStore.setState({
    user: {
      userId: 5,
      email: 'expert@farmely.vn',
      fullName: 'ThS. Nguyễn Hoàng Nam',
      role: 'expert'
    }
  });

  vi.spyOn(apiClient, 'apiFetch').mockImplementation((path) => {
    const pathStr = String(path);
    if (pathStr.includes('/api/rentals')) {
      return Promise.resolve({
        data: [
          {
            rentalId: 20,
            plotId: 20,
            plotCode: 'P-20',
            name: 'Thửa P-20',
            contractCode: 'HD-2026-FARM-4764',
            renterName: 'Lô Thái Quyền',
            renterEmail: 'customer@farmely.vn',
            varietyName: 'Cây mèo dã',
            crop: 'Cây mèo dã',
            currentDay: 1,
            totalDays: 45,
            durationDays: 45,
            progressPercent: 2,
            status: 'ACTIVE',
            expertEmail: 'expert@farmely.vn',
            expertId: 5,
            staffName: 'Trần Văn Lực (CVLĐ)',
            temp: '27.96°C',
            soilMoisture: '69.15%'
          }
        ]
      });
    }
    if (pathStr.includes('/api/tasks')) {
      return Promise.resolve({
        data: [
          {
            taskId: 101,
            rentalId: 20,
            plotCode: 'P-20',
            title: 'Làm đất & Lên luống chuẩn VietGAP',
            cropDay: 1,
            status: 'COMPLETED',
            workerName: 'Trần Văn Lực (CVLĐ)',
            notes: 'Đã hoàn tất đánh luống cao 25cm.',
            evidenceImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600'
          }
        ]
      });
    }
    return Promise.resolve({ data: [] });
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe('ExpertDashboard Plots Progress & 1-1 Chat Navigation', () => {
  it('mounts ExpertDashboard and shows supervised plot with expand progress button', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <ExpertDashboard />
        </BrowserRouter>
      );
    });

    // Wait a tick for initial fetches
    await act(async () => {
      await Promise.resolve();
    });

    // Switch to 'plots' tab
    const plotsTabBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Thửa Đất Giám Sát')
    );
    expect(plotsTabBtn).toBeDefined();

    await act(async () => {
      plotsTabBtn.click();
    });

    // Check that P-20 and details are displayed
    expect(host.textContent).toContain('Thửa Đất Giám Sát Kỹ Thuật');
    expect(host.textContent).toContain('P-20');
    expect(host.textContent).toContain('Lô Thái Quyền');
    expect(host.textContent).toContain('Cây mèo dã');

    // Check button to expand progress
    const expandBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Xem tiến trình & nhật ký công việc')
    );
    expect(expandBtn).toBeDefined();

    // Click to expand progress
    await act(async () => {
      expandBtn.click();
    });

    // Check that the progress timeline is now visible
    expect(host.textContent).toContain('Tiến Trình Công Việc & Nhật Ký Hiện Trường');
    expect(host.textContent).toContain('Làm đất & Lên luống chuẩn VietGAP');

    // Check chat button inside card
    const chatBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Mở Kênh Tư Vấn 1-1 Với Khách')
    );
    expect(chatBtn).toBeDefined();

    // Click chat button
    await act(async () => {
      chatBtn.click();
    });

    // Should navigate to 'chat' tab with Lô Thái Quyền (CONS-401)
    expect(host.textContent).toContain('Hộp Thư Tư Vấn & Chỉ Đạo');
    expect(host.textContent).toContain('Lô Thái Quyền');
  });
});
