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

  it('phải phân loại task có status COMPLETED hoặc DONE vào nhóm Đã xong và hiển thị badge Đã hoàn tất', async () => {
    const mockPlot = {
      id: 'PLOT-P-14',
      plotCode: 'P-14',
      rentalId: 28,
      name: 'Thửa P-14',
      crop: 'Rau dền đỏ F1',
      mode: 'Assisted-growing',
      cultivationMode: 'ASSISTED',
      currentDay: 2,
      totalDays: 35
    };

    const mockTasks = [
      {
        taskId: 52,
        id: 'TSK-52',
        rentalId: 28,
        plotCode: 'P-14',
        title: 'Làm đất mịn & Bón lót',
        cropDay: 1,
        day: 1,
        status: 'COMPLETED',
        proofPhoto: 'https://images.unsplash.com/photo-test',
        evidenceImageUrl: 'https://images.unsplash.com/photo-test',
        completedAt: '08:30 - 03/11/2026',
        workerName: 'Trần Văn Lực'
      },
      {
        taskId: 53,
        id: 'TSK-53',
        rentalId: 28,
        plotCode: 'P-14',
        title: 'Gieo hạt dền đỏ',
        cropDay: 2,
        day: 2,
        status: 'IN_PROGRESS',
        proofPhoto: null,
        workerName: 'Trần Văn Lực'
      }
    ];

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTasks })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={mockPlot}
            plots={[mockPlot]}
            operations={{ tasks: [], diary: [] }}
            stages={[]}
          />
        </BrowserRouter>
      );
    });

    // Chuyển sang tab Công việc & Nhật ký
    const tasksTabBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Công việc & Nhật ký')
    );
    expect(tasksTabBtn).toBeTruthy();

    await act(async () => {
      tasksTabBtn.click();
    });

    // 1. Task TSK-52 đã COMPLETED -> phải có trong danh sách và hiển thị nhãn "Đã hoàn tất"
    expect(host.textContent).toContain('Làm đất mịn & Bón lót');
    expect(host.textContent).toContain('Đã hoàn tất');

    // 2. Task TSK-53 đang IN_PROGRESS -> phải hiển thị nhãn "Đang thực hiện"
    expect(host.textContent).toContain('Gieo hạt dền đỏ');
    expect(host.textContent).toContain('Đang thực hiện');

    // 3. Số lượng hiển thị: Đã xong ít nhất 1, Hôm nay 1
    const doneTab = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Đã xong & Nhật ký')
    );
    expect(doneTab).toBeTruthy();
    expect(doneTab.textContent).toContain('(1)');
  });
});
