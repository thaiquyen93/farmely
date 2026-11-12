import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPlotWorkspace from './CustomerPlotWorkspace';
import PublicNavbar from '../layout/PublicNavbar';
import { getNotificationsForUser, sendNotification } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';

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
  useAuthStore.setState({ user: null, isAuthenticated: false });
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

  it('handles Harvest Day simulation: upcoming count is 0, and uncompleted tasks stay uncompleted until Staff finishes them', async () => {
    const harvestPlot = {
      ...selfPlot,
      currentDay: 45,
      totalDays: 45
    };

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={harvestPlot}
            plots={[harvestPlot]}
            activeTab="tasks"
            stages={[
              { stepOrder: 1, name: 'Gieo hạt & Cây con', dayStart: 1, dayEnd: 10, guide: 'Chăm sóc cây non' },
              { stepOrder: 2, name: 'Xuống giống & Tưới ẩm định kỳ', dayStart: 10, dayEnd: 24, guide: 'Cấy cây con mật độ 20x25cm' },
              { stepOrder: 3, name: 'Bón thúc & Phòng trừ sinh học', dayStart: 25, dayEnd: 35, guide: 'Bón thúc đạm cá' },
              { stepOrder: 4, name: 'Cách ly VietGAP & Thu hoạch', dayStart: 36, dayEnd: 45, guide: 'Ngừng phân thuốc, thu hoạch lứa quả chín' }
            ]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // 1. Phải hiển thị Việc chưa tới (0)
    expect(host.textContent).toContain('Việc chưa tới (0)');

    // 2. Vì chưa có việc nào được Staff hoặc chủ vườn thực sự hoàn tất -> Đã xong & Nhật ký phải là (0)
    const doneTab = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Đã xong & Nhật ký')
    );
    expect(doneTab).toBeTruthy();
    expect(doneTab.textContent).toContain('(0)');

    // 3. Khi click vào tab "Việc chưa tới", không được hiển thị task Ngày 10 hay Ngày 25
    const upcomingTabBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Việc chưa tới')
    );
    expect(upcomingTabBtn).toBeTruthy();

    await act(async () => {
      upcomingTabBtn.click();
    });

    // Phải báo danh sách trống "Chưa có công việc nào"
    expect(host.textContent).toContain('Chưa có công việc nào');
    expect(host.textContent).not.toContain('Xuống giống & Tưới ẩm định kỳ');
    expect(host.textContent).not.toContain('Bón thúc & Phòng trừ sinh học');
  });

  it('shows only genuinely Staff-completed tasks as completed when time-flying to Harvest Day in Assisted-Growing mode', async () => {
    const assistedHarvestPlot = {
      id: 'PLOT-P10',
      rentalId: 10,
      plotCode: 'P-10',
      name: 'Thửa P-10',
      mode: 'Assisted-Growing',
      cultivationMode: 'ASSISTED',
      startDate: '2026-09-20T00:00:00Z',
      currentDay: 45,
      totalDays: 45,
      crop: 'Cải bẹ xanh',
      status: 'ACTIVE'
    };

    const mockTasks = [
      {
        taskId: 201,
        id: 'TSK-201',
        rentalId: 10,
        plotCode: 'P-10',
        title: 'Làm đất & Bón lót (Staff đã làm)',
        cropDay: 1,
        day: 1,
        plotCurrentDay: 45,
        status: 'COMPLETED',
        completionSource: 'STAFF',
        proofPhoto: 'https://example.com/staff-done.jpg',
        evidenceImageUrl: 'https://example.com/staff-done.jpg',
        completedAt: '08:30 - 20/09/2026',
        workerName: 'Trần Văn Lực'
      },
      {
        taskId: 202,
        id: 'TSK-202',
        rentalId: 10,
        plotCode: 'P-10',
        title: 'Bón thúc đợt 1 (Staff chưa làm)',
        cropDay: 12,
        day: 12,
        plotCurrentDay: 45,
        status: 'PENDING',
        completionSource: null,
        proofPhoto: null,
        workerName: 'Trần Văn Lực'
      },
      {
        taskId: 203,
        id: 'TSK-203',
        rentalId: 10,
        plotCode: 'P-10',
        title: 'Tỉa lá già (bị gán DEMO cũ)',
        cropDay: 25,
        day: 25,
        plotCurrentDay: 45,
        status: 'COMPLETED',
        completionSource: 'DEMO',
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
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={assistedHarvestPlot}
            plots={[assistedHarvestPlot]}
            activeTab="tasks"
            stages={[]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    const doneTab = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Đã xong & Nhật ký')
    );
    expect(doneTab).toBeTruthy();
    expect(doneTab.textContent).toContain('(1)');

    await act(async () => {
      doneTab.click();
    });

    expect(host.textContent).toContain('Làm đất & Bón lót (Staff đã làm)');
    expect(host.textContent).not.toContain('Bón thúc đợt 1 (Staff chưa làm)');
    expect(host.textContent).not.toContain('Tỉa lá già (bị gán DEMO cũ)');
  });
});

describe('Assisted-Growing Split-Screen Demo, Upload-to-Done & Staff Notifications', () => {
  const assistedPlot = {
    id: 'PLOT-P09',
    rentalId: 7,
    plotCode: 'P-09',
    name: 'Thửa P-09',
    mode: 'Assisted-Growing',
    cultivationMode: 'ASSISTED',
    startDate: '2026-11-15T00:00:00Z',
    currentDay: 0,
    totalDays: 55,
    crop: 'Dưa leo baby F1',
    status: 'ACTIVE'
  };

  it('keeps Assisted Day 1 care tasks incomplete until Staff uploads photo proof & confirms, and sends STAFF notification on START_NOW', async () => {
    let staffVerified = false;
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/api/rentals/7/simulate-time') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { rentalId: 7, seasonKey: 'SEASON-1', currentDay: 1, totalDays: 55 } })
        };
      }
      if (url.includes('/api/tasks')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                taskId: 13,
                rentalId: 7,
                plotCode: 'P-09',
                title: 'Làm đất xốp & Bón lót rãnh',
                cropDay: 1,
                plotCurrentDay: 1,
                status: staffVerified ? 'DONE' : 'PENDING',
                completionSource: staffVerified ? 'STAFF' : null,
                proofPhoto: staffVerified ? 'https://example.com/proof-day1.jpg' : null
              }
            ]
          })
        };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={assistedPlot}
            plots={[assistedPlot]}
            activeTab="overview"
            stages={[{ stepOrder: 1, name: 'Làm đất xốp & Bón lót rãnh', dayStart: 1, dayEnd: 7, guide: 'Lên luống VietGAP' }]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // Chưa bắt đầu mùa vụ -> bấm Bắt đầu mùa vụ ngay
    const startBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Bắt đầu mùa vụ ngay')
    );
    expect(startBtn).toBeTruthy();

    await act(async () => {
      startBtn.click();
    });

    // Ngày 1 không được tự DONE trước khi Staff upload ảnh
    expect(host.textContent).toContain('Làm đất xốp & Bón lót rãnh');
    expect(host.textContent).not.toContain('✓ ĐÃ XONG');

    // Notification phải được gửi cho cả STAFF lẫn FIELD_WORKER role
    const staffNotifs = getNotificationsForUser({ userId: 8, role: 'STAFF' });
    const workerNotifs = getNotificationsForUser({ userId: 8, role: 'FIELD_WORKER' });
    expect(staffNotifs.some((n) => n.title.includes('P-09'))).toBe(true);
    expect(workerNotifs.some((n) => n.title.includes('P-09'))).toBe(true);

    // Giả lập Staff vừa upload ảnh & bấm xác nhận hoàn thành taskId 13
    staffVerified = true;
    await act(async () => {
      window.dispatchEvent(new CustomEvent('farmely_task_completed', { detail: { taskId: 13 } }));
    });

    // Khi Staff đã xác nhận + có ảnh minh chứng -> Customer hiển thị ✓ ĐÃ XONG ngay cả ở Ngày 1
    expect(host.textContent).toContain('✓ ĐÃ XONG');
  });

  it('uses lg:flex-row and flex-1 on harvested banner so split-screen text is never crushed, and shows compact Bell on narrow navbar', async () => {
    const plotAtHarvest = { ...assistedPlot, currentDay: 55 };
    const harvest = {
      harvestId: 99,
      rentalId: 7,
      yieldAmount: 51,
      formattedYield: '51.00 kg',
      harvestDate: '2027-01-14',
      harvestDateFormatted: '14/01/2027',
      enteredByWorker: 'Trần Văn Lực'
    };

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={plotAtHarvest}
            plots={[plotAtHarvest]}
            activeTab="overview"
            stages={[
              { stepOrder: 1, name: 'Làm đất', dayStart: 1, dayEnd: 10 },
              { stepOrder: 2, name: 'Thu hoạch', dayStart: 45, dayEnd: 55 }
            ]}
            operations={{ tasks: [], diary: [] }}
            harvestResults={[harvest]}
            latestHarvest={harvest}
          />
        </BrowserRouter>
      );
    });

    const harvestBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Ngày kết thúc')
    );
    expect(harvestBtn).toBeTruthy();
    const matchDay = Number(harvestBtn.textContent.match(/Ngày\s+(\d+)/)?.[1] || 55);

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/api/rentals/7/simulate-time') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { rentalId: 7, seasonKey: 'SEASON-1', currentDay: matchDay, totalDays: matchDay } })
        };
      }
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    });

    await act(async () => {
      harvestBtn.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    const banner = host.querySelector('[title="Bấm để xem Báo cáo thu hoạch & Biên bản nghiệm thu"]');
    expect(banner).toBeTruthy();
    expect(banner.className).toContain('lg:flex-row');
    expect(banner.firstElementChild.className).toContain('flex-1');

    // Check compact Bell visibility in PublicNavbar mobile bar
    useAuthStore.setState({ user: { id: 8, userId: 8, role: 'STAFF', fullName: 'Trần Văn Lực' }, isAuthenticated: true });
    await act(async () => {
      root.render(
        <BrowserRouter>
          <PublicNavbar />
        </BrowserRouter>
      );
    });

    const bellButtons = host.querySelectorAll('button[aria-label="Thông báo hệ thống"]');
    expect(bellButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('newly rented plot shows uncompleted handover task (0 completed) and pops up toast when Staff finishes a task', async () => {
    const newlyRentedPlot = {
      id: 'PLOT-P-10',
      plotCode: 'P-10',
      rentalId: 11,
      name: 'Thửa P-10',
      crop: 'Xà lách Romaine VietGAP',
      mode: 'Assisted-Growing',
      cultivationMode: 'ASSISTED',
      startDate: '2099-11-16',
      currentDay: 0,
      totalDays: 45,
      isScheduled: true,
      seasonStatus: 'SCHEDULED'
    };

    const handoverTask = {
      taskId: 70,
      id: 'TSK-70',
      rentalId: 11,
      plotCode: 'P-10',
      stepOrder: 0,
      cropDay: 0,
      title: 'Khởi tạo và bàn giao thửa đất cho mùa vụ mới',
      dueDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
      status: 'PENDING',
      completionSource: null,
      proofPhoto: null
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/tasks')) {
        return { ok: true, json: async () => ({ success: true, data: [handoverTask] }) };
      }
      if (url.includes('/api/harvest')) {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={newlyRentedPlot}
            plots={[newlyRentedPlot]}
            activeTab="tasks"
            stages={[{ stepOrder: 1, name: 'Giai đoạn 1', dayStart: 1, dayEnd: 10 }]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(host.textContent).toContain('Khởi tạo và bàn giao thửa đất cho mùa vụ mới');
    expect(host.textContent).toContain('Đã xong & Nhật ký (0)');
    expect(host.textContent).toContain('Chưa có công việc nào hoàn tất');

    // PublicNavbar pops live toast immediately when Staff sends completion notification to Customer
    useAuthStore.setState({ user: { id: 1, userId: 1, role: 'CUSTOMER', fullName: 'Lô Thái Quyền' }, isAuthenticated: true });
    await act(async () => {
      root.render(
        <BrowserRouter>
          <PublicNavbar />
        </BrowserRouter>
      );
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      await sendNotification({
        targetRole: 'CUSTOMER',
        userId: 1,
        type: 'TASK_COMPLETED',
        title: '✅ Hoàn thành công việc tại thửa P-10',
        content: 'Nhân viên vừa hoàn thành "Khởi tạo và bàn giao thửa đất cho mùa vụ mới" tại thửa P-10.',
        link: '/customer/dashboard?plot=RENTAL-11&tab=tasks'
      });
      await new Promise((r) => setTimeout(r, 20));
    });

    const toast = host.querySelector('[role="status"]');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Hoàn thành công việc tại thửa P-10');
    expect(toast.textContent).toContain('Xem ngay');
  });
});
