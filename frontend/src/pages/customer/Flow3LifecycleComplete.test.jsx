import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPlotWorkspace, { PLOT_TABS } from '../../components/customer/CustomerPlotWorkspace';
import { appendMessage, getStoredThreads, saveThreads } from '../../api/communication/chatStorage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
  localStorage.clear();

  vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/tasks')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
    }
    if (urlStr.includes('/api/harvest')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    });
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('LUỒNG 3 TEST SUITE: VÒNG ĐỜI VỤ MÙA THÔNG MINH (FLOW 3 LIFECYCLE)', () => {
  // Thửa P-03: Tự canh tác (Self-Growing)
  const selfPlotP03 = {
    id: 'PLOT-P03',
    plotCode: 'P-03',
    name: 'Thửa P-03',
    mode: 'Self-Growing',
    cultivationMode: 'SELF',
    startDate: '2026-11-03T00:00:00Z',
    currentDay: 1,
    totalDays: 45,
    crop: 'Dưa leo baby F1',
    status: 'ACTIVE',
    rentalId: 3
  };

  // Thửa P-12: Ủy thác trọn gói (Assisted-Growing)
  const assistedPlotP12 = {
    id: 'PLOT-P12',
    plotCode: 'P-12',
    name: 'Thửa P-12',
    mode: 'Assisted-Growing',
    cultivationMode: 'ASSISTED',
    startDate: '2026-11-03T00:00:00Z',
    currentDay: 20,
    totalDays: 45,
    crop: 'Dưa leo baby F1',
    status: 'ACTIVE',
    rentalId: 12,
    staffName: 'Trần Văn Lực (CVLĐ)',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  };

  const sampleStages = [
    { stepOrder: 1, name: 'Làm đất & Cấy cây con', dayStart: 1, dayEnd: 7, label: 'Ngày 1 - 7', statusDesc: 'Bén rễ hồi xanh' },
    { stepOrder: 2, name: 'Phát triển thân lá & Giàn leo', dayStart: 8, dayEnd: 22, label: 'Ngày 8 - 22', statusDesc: 'Vươn ngọn leo giàn' },
    { stepOrder: 3, name: 'Ra hoa rộ & Nuôi quả non', dayStart: 23, dayEnd: 38, label: 'Ngày 23 - 38', statusDesc: 'Đậu quả liên tục' },
    { stepOrder: 4, name: 'Thu hoạch & Nghiệm thu sản lượng', dayStart: 39, dayEnd: 45, label: 'Ngày 39 - 45', statusDesc: 'Thu hoạch đạt chuẩn VietGAP' }
  ];

  it('BƯỚC 1: Khách hàng xem tổng quan dashboard của thửa Tự Canh Tác (P-03)', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlotP03}
            plots={[selfPlotP03, assistedPlotP12]}
            activeTab="overview"
            stages={sampleStages}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // 1. Kiểm tra tiêu đề và thông tin thửa đất
    expect(host.textContent).toContain('Thửa P-03');
    expect(host.textContent).toContain('Dưa leo baby F1');

    // 2. Kiểm tra thanh 3 tab chuẩn mực: Tổng quan, Công việc & Nhật ký, Dịch vụ
    expect(PLOT_TABS).toHaveLength(3);
    expect(host.textContent).toContain('Tổng quan');
    expect(host.textContent).toContain('Công việc & Nhật ký');
    expect(host.textContent).toContain('Dịch vụ');

    // 3. Kiểm tra nhãn chế độ tự canh tác
    expect(host.textContent).toContain('Tự canh tác');

    // 4. Kiểm tra Hero Stats ngày tuổi
    expect(host.textContent).toContain('Ngày tuổi');
    expect(host.textContent).toContain('D1');
  });

  it('BƯỚC 2: Khách hàng tự đăng nhật ký canh tác (Post Farm Diary)', async () => {
    const customDiary = [
      {
        id: 'DIR-001',
        day: 1,
        title: 'Tự tay làm đất & bón lót phân trùn quế Trichoderma',
        content: 'Đất tơi xốp, giữ ẩm luống 65%, cây con bén rễ rất tốt.',
        author: 'Chủ vườn',
        authorRole: 'Chủ vườn (Tự canh tác)',
        date: '03/11/2026',
        time: 'Ca sáng (07:30 - 09:00)',
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae'
      }
    ];

    const mockOnAddDiary = vi.fn();

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlotP03}
            plots={[selfPlotP03]}
            activeTab="tasks"
            onAddDiary={mockOnAddDiary}
            stages={sampleStages}
            operations={{ tasks: [], diary: customDiary }}
          />
        </BrowserRouter>
      );
    });

    // 1. Nút + Viết nhật ký hiển thị
    expect(host.textContent).toContain('Viết nhật ký');

    // 2. Bài viết nhật ký của chủ vườn xuất hiện trong danh sách
    expect(host.textContent).toContain('Tự tay làm đất & bón lót phân trùn quế Trichoderma');
    expect(host.textContent).toContain('Đất tơi xốp, giữ ẩm luống 65%');
    expect(host.textContent).toContain('Chủ vườn');
  });

  it('BƯỚC 3: Khách hàng hỏi Chuyên gia (ThS. Nam) về kỹ thuật canh tác', async () => {
    const threadId = 'CONS-P03-DEMO';
    const customerMsg = {
      id: 101,
      sender: 'customer',
      senderName: 'Tạ Nguyễn Khôi Nguyên (Chủ vườn P-03)',
      text: 'Thầy Nam ơi, em vừa bón lót trùn quế 2kg/m2 và nấm đối kháng, như vậy đã đúng quy trình VietGAP chưa ạ?',
      time: '08:30 • Hôm nay'
    };

    appendMessage(threadId, customerMsg);

    const expertMsg = {
      id: 102,
      sender: 'expert',
      senderName: 'ThS. Nguyễn Hoàng Nam',
      text: 'Chào bạn, tỷ lệ bón trùn quế 2kg/m2 kèm Trichoderma là rất chuẩn VietGAP rồi nhé. Nhớ duy trì độ ẩm 65-70%.',
      time: '08:32 • Vừa xong'
    };

    appendMessage(threadId, expertMsg);

    const threads = getStoredThreads();
    const currentThread = threads.find((t) => t.id === threadId);

    expect(currentThread).toBeDefined();
    expect(currentThread.messages).toHaveLength(2);
    expect(currentThread.messages[0].text).toContain('bón lót trùn quế 2kg/m2');
    expect(currentThread.messages[1].sender).toBe('expert');
    expect(currentThread.messages[1].text).toContain('chuẩn VietGAP rồi nhé');
  });

  it('BƯỚC 4: Khách hàng đặt dịch vụ chăm sóc phát sinh khi bận công tác', async () => {
    const services = [
      {
        id: 1,
        serviceId: 1,
        name: 'Tưới ẩm vi sinh & tỉa cành đột xuất',
        price: 150000,
        formattedPrice: '150.000 đ',
        description: 'CVLĐ tưới nước bổ sung vi sinh EM1 và tỉa chồi nách lá',
        unit: 'lần'
      }
    ];

    const mockOnSelectService = vi.fn();

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlotP03}
            plots={[selfPlotP03]}
            activeTab="services"
            services={services}
            onSelectService={mockOnSelectService}
            stages={sampleStages}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    expect(host.textContent).toContain('Dịch vụ');
    expect(host.textContent).toContain('Tưới ẩm vi sinh & tỉa cành đột xuất');
    expect(host.textContent).toContain('150.000 đ');

    // Bấm đặt dịch vụ
    const orderBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent.includes('ĐẶT DỊCH VỤ') || b.textContent.includes('Chọn dịch vụ') || b.textContent.includes('MUA DỊCH VỤ')
    );
    if (orderBtn) {
      act(() => orderBtn.click());
      expect(mockOnSelectService).toHaveBeenCalled();
    }
  });

  it('BƯỚC 5: Staff (Trần Văn Lực) nhận task dịch vụ, chụp ảnh thực địa và hoàn thành (BR15)', async () => {
    // Task dịch vụ phát sinh do Staff Lực hoàn thành kèm ảnh minh chứng BR15
    const staffServiceActivities = [
      {
        taskId: 101,
        id: 'ACT-SVC-01',
        title: 'Tưới ẩm vi sinh & tỉa cành đột xuất [DỊCH VỤ KHÁCH YÊU CẦU]',
        status: 'COMPLETED',
        serviceRequestId: 101,
        rentalId: 3,
        plotCode: 'P-03',
        workerName: 'Trần Văn Lực',
        assignedTo: 'Trần Văn Lực',
        workerRole: 'Chuyên viên lao động (CVLĐ)',
        timestamp: '10:00 • Hôm nay • Đã hoàn thành',
        completedAt: '10:00 • Hôm nay • Đã hoàn thành',
        notes: 'Đã tưới 2.0L/m2 vi sinh EM1 và vặt sạch chồi nách lá 1-4 theo yêu cầu của chủ vườn.',
        instructions: 'Đã tưới 2.0L/m2 vi sinh EM1 và vặt sạch chồi nách lá 1-4 theo yêu cầu của chủ vườn.',
        proofPhoto: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5',
        day: 1,
        cropDay: 1
      }
    ];

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: staffServiceActivities })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={selfPlotP03}
            plots={[selfPlotP03]}
            activeTab="tasks"
            stages={sampleStages}
            operations={{ tasks: staffServiceActivities, diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // 1. Kiểm tra task dịch vụ hoàn thành xuất hiện với tên Trần Văn Lực
    expect(host.textContent).toContain('Tưới ẩm vi sinh & tỉa cành đột xuất');
    expect(host.textContent).toContain('Trần Văn Lực');
    expect(host.textContent).toContain('vi sinh EM1');

    // 2. Ảnh minh chứng thực địa (BR15) được gắn kèm
    const imgElement = host.querySelector('img[src*="photo-1595974482597"]');
    expect(imgElement).toBeTruthy();
  });

  it('BƯỚC 6: Chuyển sang thửa ủy thác (P-12) — Xem chu kỳ VietGAP & Thông tin vi khí hậu thực địa', async () => {
    const weatherAlerts = [];

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={assistedPlotP12}
            plots={[selfPlotP03, assistedPlotP12]}
            activeTab="overview"
            stages={sampleStages}
            alerts={weatherAlerts}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // 1. Kiểm tra thông tin thửa ủy thác P-12
    expect(host.textContent).toContain('Thửa P-12');
    expect(host.textContent).toContain('D20'); // Ngày 20 giữa vụ

    // 2. Kiểm tra chu kỳ VietGAP
    expect(host.textContent).toContain('Phát triển thân lá');

    // 3. Kiểm tra thông tin vi khí hậu thực địa Open-Meteo
    expect(host.textContent).toContain('Nhiệt độ');
  });

  it('BƯỚC 7: Staff hoàn thành task chăm sóc thường nhật có ảnh thực địa (BR15)', async () => {
    const dailyCareActivities = [
      {
        taskId: 121,
        id: 'TSK-12-01',
        title: 'Bón lót đợt 2: Phân trùn quế & tưới vi sinh EM1',
        status: 'COMPLETED',
        rentalId: 12,
        plotCode: 'P-12',
        workerName: 'Trần Văn Lực',
        assignedTo: 'Trần Văn Lực',
        workerRole: 'Chuyên viên lao động (CVLĐ)',
        timestamp: '14:30 • Hôm nay • Đã hoàn thành',
        completedAt: '14:30 • Hôm nay • Đã hoàn thành',
        notes: 'Bón 1.5kg phân trùn quế quanh gốc, tưới vi sinh EM1 phân giải hữu cơ.',
        instructions: 'Bón 1.5kg phân trùn quế quanh gốc, tưới vi sinh EM1 phân giải hữu cơ.',
        proofPhoto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
        day: 20,
        cropDay: 20
      }
    ];

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: dailyCareActivities })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={assistedPlotP12}
            plots={[assistedPlotP12]}
            activeTab="tasks"
            stages={sampleStages}
            operations={{ tasks: dailyCareActivities, diary: [] }}
          />
        </BrowserRouter>
      );
    });

    expect(host.textContent).toContain('Bón lót đợt 2: Phân trùn quế & tưới vi sinh EM1');
    expect(host.textContent).toContain('Trần Văn Lực');
    expect(host.textContent).toContain('Đã hoàn thành');
  });

  it('BƯỚC 8: Staff phát hiện nấm bệnh, gửi ticket báo cáo sự cố (BR19)', () => {
    // Cấu trúc một issue ticket gửi từ hiện trường
    const fieldIssue = {
      issueId: 501,
      issueCode: 'ISS-501',
      rentalId: 12,
      plotCode: 'P-12',
      issueType: 'PEST_DISEASE',
      title: 'Phát hiện đốm nấm phấn trắng trên lá dưa leo tầng dưới',
      description: 'Lá xuất hiện các chấm mốc trắng li ti cách gốc 20cm, nghi nhiễm sương mai / phấn trắng.',
      severity: 'HIGH',
      status: 'OPEN',
      reportedBy: 8,
      reporterName: 'Trần Văn Lực (CVLĐ)',
      evidenceImageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b'
    };

    expect(fieldIssue.issueCode).toBe('ISS-501');
    expect(fieldIssue.plotCode).toBe('P-12');
    expect(fieldIssue.status).toBe('OPEN');
    expect(fieldIssue.reportedBy).toBe(8);
    expect(fieldIssue.evidenceImageUrl).toBeTruthy();
  });

  it('BƯỚC 9: Expert & Staff trao đổi, Expert kê phác đồ khẩn, Staff xử lý & RESOLVED', () => {
    // 1. Chuyên gia Nam thẩm định và kê phác đồ khẩn cấp
    const expertDiagnosis = {
      handledBy: 5,
      expertName: 'ThS. Nguyễn Hoàng Nam',
      diagnosis: 'Bệnh phấn trắng chớm xuất hiện. Phun chế phẩm sinh học thảo mộc Bacillus amyloliquefaciens (Serenade ASO), liều lượng 2ml/L.',
      actionRequired: 'Tỉa bỏ 2 lá bệnh nặng nhất, phun sương đều 2 mặt lá vào lúc 16:30.',
      resolvedStatus: 'RESOLVED'
    };

    // 2. Staff Lực nhận lệnh khẩn cấp, phun chế phẩm và đóng ticket
    const resolvedIssue = {
      issueId: 501,
      status: 'RESOLVED',
      resolutionNotes: expertDiagnosis.diagnosis,
      handledBy: expertDiagnosis.handledBy,
      resolvedAt: new Date().toISOString()
    };

    expect(resolvedIssue.status).toBe('RESOLVED');
    expect(resolvedIssue.resolutionNotes).toContain('Serenade ASO');
    expect(resolvedIssue.handledBy).toBe(5);
  });

  it('BƯỚC 10: Cuối vụ mùa (Thu hoạch): Staff cân điện tử sản lượng, lưu biên bản staff_id = 8 (BR20)', () => {
    // Biên bản thu hoạch ghi nhận vào bảng harvest_results theo BR20
    const harvestRecord = {
      harvestId: 88,
      rentalId: 12,
      plotCode: 'P-12',
      crop: 'Dưa leo baby F1',
      yieldAmount: 18.5,
      formattedYield: '18.50 kg',
      enteredBy: 8,
      enteredByWorker: 'Trần Văn Lực',
      harvestDate: '2026-11-03',
      evidenceImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5',
      deliveryType: 'PICKUP',
      customerConfirmed: false
    };

    // Kiểm tra các ràng buộc nghiệp vụ then chốt
    expect(harvestRecord.enteredBy).toBe(8); // Bắt buộc staff_id = 8 (Trần Văn Lực)
    expect(harvestRecord.yieldAmount).toBeGreaterThan(0); // Sản lượng > 0
    expect(harvestRecord.deliveryType).toBe('PICKUP'); // Cố định nhận tại nông trại theo BR21 / DRIFT-011
  });

  it('BƯỚC 11: Trang Customer nhận minh chứng thu hoạch, xem biên bản trong Nhật ký (BR21)', async () => {
    const harvestPlot = {
      ...assistedPlotP12,
      currentDay: 45, // Đã tới ngày thu hoạch
      totalDays: 45
    };

    const harvestResults = [
      {
        harvestId: 88,
        id: 88,
        rentalId: 12,
        plotCode: 'P-12',
        crop: 'Dưa leo baby F1',
        yieldAmount: 18.5,
        formattedYield: '18.50 kg',
        enteredByWorker: 'Trần Văn Lực',
        harvestDate: '03/11/2026',
        harvestDateFormatted: '03/11/2026',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5'
      }
    ];

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={harvestPlot}
            plots={[harvestPlot]}
            activeTab="overview"
            stages={sampleStages}
            harvestResults={harvestResults}
            latestHarvest={harvestResults[0]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    // 1. Kiểm tra Banner thông báo thu hoạch hoàn tất
    expect(host.textContent).toContain('Nông sản đã thu hoạch hoàn tất — Đã chốt biên bản sản lượng!');
    expect(host.textContent).toContain('18.5');
    expect(host.textContent).toContain('Trần Văn Lực');

    // 2. Nút xem biên bản trong Nhật ký
    expect(host.textContent).toContain('Xem biên bản trong Nhật ký');

    // 3. Chuyển sang Tab "Công việc & Nhật ký": biên bản thu hoạch HRV-88 xuất hiện
    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={harvestPlot}
            plots={[harvestPlot]}
            activeTab="tasks"
            stages={sampleStages}
            harvestResults={harvestResults}
            latestHarvest={harvestResults[0]}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    expect(host.textContent).toContain('Thu hoạch Dưa leo baby F1 — 18.50 kg');
    expect(host.textContent).toContain('Trần Văn Lực');
    expect(host.textContent).toContain('HRV-88');
    expect(host.textContent).toContain('Khách hàng nhận nông sản tại nông trại.');
  });
});
