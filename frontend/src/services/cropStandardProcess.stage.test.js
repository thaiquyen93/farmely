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

  it('REGRESSION: gom nhóm dbStages có trùng dayOffset thành một mốc duy nhất, không sinh node lặp', () => {
    const duplicateStages = [
      { stepId: 136, stage: 'Làm đất & Xử lý giá thể vi sinh', dayOffset: 1 },
      { stepId: 140, stage: 'Làm đất & Xử lý giá thể vi sinH', dayOffset: 1 },
      { stepId: 137, stage: 'Xuống giống & Tưới ẩm định kỳ', dayOffset: 10 },
      { stepId: 141, stage: 'Xuống giống & Tưới ẩm định kỳ', dayOffset: 10 },
      { stepId: 138, stage: 'Bón thúc & Phòng trừ sinh học', dayOffset: 25 },
      { stepId: 142, stage: 'Bón thúc & Phòng trừ sinh học', dayOffset: 25 },
      { stepId: 139, stage: 'Cách ly VietGAP & Thu hoạch', dayOffset: 45 },
      { stepId: 143, stage: 'Cách ly VietGAP & Thu hoạch', dayOffset: 45 }
    ];

    const r = resolveStandardCropProcess({ crop: 'Cây mèo dã', totalDays: 45, currentDay: 1 }, duplicateStages);
    expect(r.stages).toHaveLength(4);
    expect(r.stages.map((s) => s.dayStart)).toEqual([1, 10, 25, 45]);
    expect(r.stages[0].label).toBe('Ngày 1 – 9');
    expect(r.stages[1].label).toBe('Ngày 10 – 24');
    expect(r.stages[2].label).toBe('Ngày 25 – 44');
    expect(r.stages[3].label).toBe('Ngày 45');
  });
});
