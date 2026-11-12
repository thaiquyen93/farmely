import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HarvestReportModal from './HarvestReportModal';
import CustomerPlotWorkspace from './CustomerPlotWorkspace';

describe('HarvestReportModal & Workspace Integration', () => {
  let container = null;
  let root = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const mockHarvest = {
    id: 'HRV-88',
    harvestCode: 'HRV-88',
    crop: 'Cải bẹ xanh',
    yieldAmount: 20.0,
    formattedYield: '20.00 kg',
    harvestDate: '2026-11-05',
    harvestDateFormatted: '05/11/2026',
    enteredByWorker: 'Trần Văn Lực',
    workerName: 'Trần Văn Lực',
    evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg',
    status: 'COMPLETED',
    plotCode: 'P-01',
    plotName: 'Thửa P-01'
  };

  const mockPlot = {
    id: 'plot-1',
    plotCode: 'P-01',
    name: 'Thửa P-01',
    cropName: 'Cải bẹ xanh',
    crop: 'Cải bẹ xanh',
    mode: 'Assisted-Growing',
    cultivationMode: 'ASSISTED',
    currentDay: 45,
    totalDays: 45,
    stage: 'Thu hoạch & Nghiệm thu',
    startDate: '2026-09-21'
  };

  it('renders HarvestReportModal with full BR20/BR21/BR23 information', async () => {
    const handleClose = vi.fn();
    const handleGoToDiary = vi.fn();

    await act(async () => {
      root.render(
        <HarvestReportModal
          harvest={mockHarvest}
          plot={mockPlot}
          totalDays={45}
          onClose={handleClose}
          onGoToDiary={handleGoToDiary}
        />
      );
    });

    const text = container.textContent;
    expect(text).toContain('Báo Cáo Nghiệm Thu Sản Lượng Vụ Mùa');
    expect(text).toContain('20.00 kg');
    expect(text).toContain('HRV-88');
    expect(text).toContain('Trần Văn Lực');
    expect(text).toContain('05/11/2026');
    expect(text).toContain('VietGAP chuẩn xuất xưởng');
    expect(text).toContain('Tự nhận tại nông trại Farmely');
    expect(text).toContain('Bảo trì & Cải tạo đất (Fallow)');
  });

  it('opens HarvestReportModal popup when clicking on harvest banner or action button in CustomerPlotWorkspace', async () => {
    const sampleStages = [
      { id: 'stg-1', name: 'Gieo hạt & Cây non', dayStart: 1, dayEnd: 15 },
      { id: 'stg-2', name: 'Phát triển sinh khối', dayStart: 16, dayEnd: 30 },
      { id: 'stg-3', name: 'Thu hoạch & Nghiệm thu', dayStart: 31, dayEnd: 45 }
    ];

    await act(async () => {
      root.render(
        <BrowserRouter>
          <CustomerPlotWorkspace
            plot={mockPlot}
            plots={[mockPlot]}
            activeTab="overview"
            stages={sampleStages}
            harvestResults={[mockHarvest]}
            latestHarvest={mockHarvest}
            operations={{ tasks: [], diary: [] }}
          />
        </BrowserRouter>
      );
    });

    expect(container.textContent).toContain('Nông sản đã thu hoạch hoàn tất — Đã chốt biên bản sản lượng!');
    expect(container.textContent).toContain('Báo cáo thu hoạch');
    expect(container.textContent).not.toContain('Xem biên bản trong Nhật ký');

    // Modal popup is not visible initially
    expect(container.textContent).not.toContain('Báo Cáo Nghiệm Thu Sản Lượng Vụ Mùa');

    // Click on "Báo cáo thu hoạch" button
    const reportButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Báo cáo thu hoạch')
    );
    expect(reportButton).toBeTruthy();

    await act(async () => {
      reportButton.click();
    });

    // Modal popup is now OPEN!
    expect(container.textContent).toContain('Báo Cáo Nghiệm Thu Sản Lượng Vụ Mùa');
    expect(container.textContent).toContain('Sản lượng chốt cân thực tế');
    expect(container.textContent).toContain('20.00 kg');
    expect(container.textContent).toContain('Trần Văn Lực');

    // Click close button inside modal
    const closeButtons = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.textContent.trim() === 'Đóng' || btn.getAttribute('title') === 'Đóng'
    );
    expect(closeButtons.length).toBeGreaterThan(0);

    await act(async () => {
      closeButtons[0].click();
    });

    // Modal popup is now closed
    expect(container.textContent).not.toContain('Báo Cáo Nghiệm Thu Sản Lượng Vụ Mùa');
  });
});
