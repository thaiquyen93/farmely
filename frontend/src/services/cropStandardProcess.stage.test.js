import { describe, it, expect } from 'vitest';
import { resolveStandardCropProcess } from './cropStandardProcess';

/**
 * Chọn giai đoạn hiện tại khi lịch template_steps có khoảng trống ngày.
 * Lỗi cũ: không bước nào IN_PROGRESS -> rơi xuống stages[length-1], nên thửa mới
 * ngày 9/80 lại hiện "Thu hoạch vét & Thu dọn tàn dư" (bước cuối vụ).
 */
describe('resolveStandardCropProcess — currentStage', () => {
  const plot = { crop: 'Cà chua bi đỏ F1', currentDay: 9, totalDays: 80 };

  // Bước đầu bắt đầu ở ngày 15 => ngày 9 chưa thuộc bước nào.
  const stagesWithGap = [
    { stepId: 1, dayOffset: 15, stage: 'Trồng cây con' },
    { stepId: 2, dayOffset: 40, stage: 'Ra hoa & đậu quả' },
    { stepId: 3, dayOffset: 70, stage: 'Thu hoạch vét & Thu dọn tàn dư' }
  ];

  it('REGRESSION: ngày 9/80 không được nhảy sang bước cuối vụ', () => {
    const r = resolveStandardCropProcess(plot, stagesWithGap);
    expect(r.currentDay).toBe(9);
    expect(r.currentStage.name).toBe('Trồng cây con');
    expect(r.currentStage.name).not.toMatch(/Thu dọn tàn dư/);
  });

  it('vẫn ưu tiên bước đang chạy khi ngày hiện tại nằm trong bước đó', () => {
    const r = resolveStandardCropProcess({ ...plot, currentDay: 45 }, stagesWithGap);
    expect(r.currentStage.name).toBe('Ra hoa & đậu quả');
    expect(r.currentStage.status).toBe('IN_PROGRESS');
  });

  it('quá bước cuối thì giữ bước cuối', () => {
    const r = resolveStandardCropProcess({ ...plot, currentDay: 80 }, stagesWithGap);
    expect(r.currentStage.name).toMatch(/Thu dọn tàn dư/);
  });
});
