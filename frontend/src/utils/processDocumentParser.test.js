import { describe, it, expect } from 'vitest';
import { parseProcessDocument } from './processDocumentParser';

describe('processDocumentParser', () => {
  const varieties = [
    { id: 1, name: 'Rau muống lá tre F1', cropName: 'Rau muống cạn' },
    { id: 5, name: 'Dưa leo baby F1', cropName: 'Dưa leo baby' }
  ];

  it('parses structured VietGAP text document into template and steps', () => {
    const rawText = `
# QUY TRÌNH KỸ THUẬT CANH TÁC CHUẨN VIETGAP - DƯA LEO BABY F1
GIỐNG_CÂY: Dưa leo baby F1
MÃ_PHIÊN_BẢN: v2.5
TRẠNG_THÁI: ACTIVE
MÔ_TẢ: Quy trình nông nghiệp chuẩn VietGAP cho giống Dưa leo baby chịu nhiệt F1.

[BƯỚC 1]
NGÀY: 0
TÊN: Làm đất & Đánh luống bón lót
LOẠI: SOIL_PREP
THỜI_LƯỢNG: 120 phút
VẬT_TƯ: Phân trùn quế vi sinh 2kg/m2
HƯỚNG_DẪN: Xới đất sâu 25cm cho tơi xốp, đánh luống cao 30cm.
NHIỆT_ĐỘ: 25 - 34
ĐỘ_ẨM: 65 - 80

[BƯỚC 2]
NGÀY: 48
TÊN: Thu hoạch dưa leo baby đợt 1
LOẠI: HARVEST
THỜI_LƯỢNG: 120 phút
VẬT_TƯ: Kéo cắt chuyên dụng, Sọt nhựa VietGAP
HƯỚNG_DẪN: Cắt cuống quả lúc sáng sớm.
    `;

    const result = parseProcessDocument(rawText, varieties);
    expect(result.varietyId).toBe('5');
    expect(result.varietyName).toBe('Dưa leo baby F1');
    expect(result.version).toBe('v2.5');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].dayOffset).toBe(0);
    expect(result.steps[0].taskType).toBe('SOIL_PREP');
    expect(result.steps[1].dayOffset).toBe(48);
    expect(result.steps[1].taskType).toBe('HARVEST');
  });

  it('parses JSON formatted process template', () => {
    const jsonText = JSON.stringify({
      name: 'Quy trình JSON Test',
      varietyId: 1,
      version: 'v3.0',
      steps: [
        {
          stepName: 'Gieo hạt mầm',
          dayOffset: 0,
          taskType: 'PLANTING',
          durationMinutes: 45
        }
      ]
    });

    const result = parseProcessDocument(jsonText, varieties);
    expect(result.varietyId).toBe('1');
    expect(result.name).toBe('Quy trình JSON Test');
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].taskType).toBe('PLANTING');
  });
});
