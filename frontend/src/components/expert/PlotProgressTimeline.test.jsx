import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlotWorkProgressTimeline from './PlotProgressTimeline';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockPlot = {
  plotCode: 'P-20',
  name: 'Thửa P-20',
  crop: 'Cây mèo dã',
  renterName: 'Lô Thái Quyền',
  renterEmail: 'customer@farmely.vn',
  staffName: 'Trần Văn Lực (CVLĐ)',
  currentDay: 1,
  totalDays: 45
};

const mockTasks = [
  {
    id: 'TASK-1',
    day: 1,
    title: 'Làm đất & Lên luống chuẩn VietGAP',
    time: '08:00 • 28/10/2026',
    status: 'COMPLETED',
    author: 'Trần Văn Lực (CVLĐ)',
    note: 'Đã hoàn tất đánh luống cao 25cm, bổ sung trùn quế vi sinh.',
    proofPhoto: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600'
  },
  {
    id: 'TASK-2',
    day: 5,
    title: 'Kiểm tra béc tưới & độ ẩm đất',
    time: '16:00 • 02/11/2026',
    status: 'PENDING',
    author: 'Trần Văn Lực (CVLĐ)',
    note: 'Đo kiểm độ ẩm đất tầng rễ, điều chỉnh béc phun sương.'
  }
];

let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('PlotWorkProgressTimeline Component', () => {
  it('renders header, plotCode, crop and counters correctly', () => {
    act(() => {
      root.render(<PlotWorkProgressTimeline plot={mockPlot} tasks={mockTasks} />);
    });

    expect(host.textContent).toContain('Tiến Trình Công Việc & Nhật Ký Hiện Trường');
    expect(host.textContent).toContain('Thửa P-20');
    expect(host.textContent).toContain('Cây mèo dã');
    expect(host.textContent).toContain('1/2 Đã hoàn thành (50%)');
    expect(host.textContent).toContain('Làm đất & Lên luống chuẩn VietGAP');
    expect(host.textContent).toContain('Kiểm tra béc tưới & độ ẩm đất');
  });

  it('filters tasks by status when filter buttons are clicked', () => {
    act(() => {
      root.render(<PlotWorkProgressTimeline plot={mockPlot} tasks={mockTasks} />);
    });

    const buttons = Array.from(host.querySelectorAll('button'));
    const completedBtn = buttons.find((b) => b.textContent.includes('Đã hoàn thành (1)'));
    expect(completedBtn).toBeDefined();

    act(() => {
      completedBtn.click();
    });

    expect(host.textContent).toContain('Làm đất & Lên luống chuẩn VietGAP');
    expect(host.textContent).not.toContain('Kiểm tra béc tưới & độ ẩm đất');

    const pendingBtn = buttons.find((b) => b.textContent.includes('Chờ thực hiện (1)'));
    expect(pendingBtn).toBeDefined();

    act(() => {
      pendingBtn.click();
    });

    expect(host.textContent).not.toContain('Làm đất & Lên luống chuẩn VietGAP');
    expect(host.textContent).toContain('Kiểm tra béc tưới & độ ẩm đất');
  });

  it('calls onOpenPhoto when clicking proof photo', () => {
    const handleOpenPhoto = vi.fn();
    act(() => {
      root.render(
        <PlotWorkProgressTimeline
          plot={mockPlot}
          tasks={mockTasks}
          onOpenPhoto={handleOpenPhoto}
        />
      );
    });

    const img = host.querySelector('img[alt="Làm đất & Lên luống chuẩn VietGAP"]');
    expect(img).not.toBeNull();

    act(() => {
      img.closest('.cursor-pointer').click();
    });

    expect(handleOpenPhoto).toHaveBeenCalledWith(
      'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600',
      'Làm đất & Lên luống chuẩn VietGAP',
      '08:00 • 28/10/2026'
    );
  });

  it('calls onOpenChat when clicking 1-1 chat button with customer', () => {
    const handleOpenChat = vi.fn();
    act(() => {
      root.render(
        <PlotWorkProgressTimeline
          plot={mockPlot}
          tasks={mockTasks}
          onOpenChat={handleOpenChat}
        />
      );
    });

    const chatBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Mở Kênh Tư Vấn 1-1 Với Khách')
    );
    expect(chatBtn).toBeDefined();

    act(() => {
      chatBtn.click();
    });

    expect(handleOpenChat).toHaveBeenCalledTimes(1);
  });
});
