import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPlotWorkspace from './CustomerPlotWorkspace';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
  localStorage.clear();

  vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    })
  );
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('CustomerPlotWorkspace Day 1 Tasks & Date Sync', () => {
  const selfPlot = {
    id: 'PLOT-P01',
    plotCode: 'P-01',
    name: 'Thửa P-01',
    mode: 'Self-Growing',
    cultivationMode: 'SELF',
    startDate: '2026-11-01T00:00:00Z',
    currentDay: 1,
    totalDays: 45,
    crop: 'Cải bẹ xanh',
    status: 'ACTIVE'
  };

  it('initializes Day 1 tasks as PENDING (not COMPLETED) so they appear in Việc hôm nay', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlot}
            plots={[selfPlot]}
            activeTab="tasks"
            stages={[
              { stepOrder: 1, name: 'Gieo hạt & Cây con', dayStart: 1, dayEnd: 10, guide: 'Chăm sóc cây non' },
              { stepOrder: 2, name: 'Phát triển thân lá', dayStart: 11, dayEnd: 25, guide: 'Bón thúc vi sinh' }
            ]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // Check filter tabs
    expect(host.textContent).toContain('Việc hôm nay (2)');
    expect(host.textContent).toContain('Đã xong & Nhật ký (0)');

    // Check that Day 1 tasks are in "Việc Cần Thực Hiện Hôm Nay"
    expect(host.textContent).toContain('Việc Cần Thực Hiện Hôm Nay');
    expect(host.textContent).toContain('Làm đất tơi xốp, bón lót phân trùn quế & xử lý Trichoderma');
    expect(host.textContent).toContain('Tưới ẩm luống đất (65-70%) & xuống giống non theo mật độ VietGAP');

    // Day 1 tasks should have "Cần làm hôm nay" badge, NOT "Đã hoàn tất"
    expect(host.textContent).toContain('Cần làm hôm nay');
    expect(host.textContent).toContain('Chưa có công việc nào hoàn tất');
  });

  it('calculates accurate cropDay based on startDate (03/11/2026 -> Ngày tuổi 3 for startDate 01/11/2026)', async () => {
    const plotOnDay3 = {
      ...selfPlot,
      currentDay: 3
    };

    const operationsWithDatedEntries = {
      tasks: [],
      diary: [
        {
          id: 'REQ-ACT-1',
          title: 'Trồng dặm bổ sung',
          time: '21:50 - 03/11/2026',
          date: '03/11/2026',
          author: 'Lô Thái Quyền',
          note: 'Thay thế cây chết sau kiểm tra tỷ lệ sống.'
        }
      ]
    };

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={plotOnDay3}
            plots={[plotOnDay3]}
            activeTab="tasks"
            stages={[]}
            operations={operationsWithDatedEntries}
          />
        </BrowserRouter>
      );
    });

    // Check that 'Trồng dặm bổ sung' shows 'Ngày tuổi 3', NOT 'Ngày tuổi 1'
    expect(host.textContent).toContain('Trồng dặm bổ sung');
    expect(host.textContent).toContain('Ngày tuổi 3');
    // Timestamp should be normalized to DD/MM/YYYY • HH:mm
    expect(host.textContent).toContain('03/11/2026 • 21:50');
  });

  it('filters out staff routine care tasks from Self-Growing workspace', async () => {
    const operationsWithLeakedStaffTasks = {
      tasks: [],
      diary: [
        {
          id: 'TASK-DIR-1',
          title: 'Nhiệm vụ chăm sóc hiện trường',
          author: 'Trần Văn Lực (Kỹ thuật viên Farmely)',
          isStaffTask: true,
          note: 'Công việc hiện trường nội bộ của CVLĐ'
        }
      ]
    };

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlot}
            plots={[selfPlot]}
            activeTab="tasks"
            stages={[]}
            operations={operationsWithLeakedStaffTasks}
          />
        </BrowserRouter>
      );
    });

    // Should NOT contain the staff routine task
    expect(host.textContent).not.toContain('Nhiệm vụ chăm sóc hiện trường');
  });
});
