import { describe, it, expect } from 'vitest';
import {
  parseReading,
  assessMetric,
  summarizePlot,
  explainAlert,
  describeSeries,
  computeHealthScore
} from './iotInsights';

describe('parseReading', () => {
  it('REGRESSION: keeps the decimal point in temperatures (28.5°C is not 285)', () => {
    expect(parseReading('28.5°C')).toBe(28.5);
    expect(parseReading('6.5')).toBe(6.5);
  });
  it('treats dot-grouped thousands as thousands', () => {
    expect(parseReading('45.000 Lux')).toBe(45000);
    expect(parseReading('1.200.000 đ')).toBe(1200000);
  });
  it('reads percentages, comma decimals and garbage', () => {
    expect(parseReading('68%')).toBe(68);
    expect(parseReading('28,5')).toBe(28.5);
    expect(parseReading('')).toBeNull();
    expect(parseReading(undefined)).toBeNull();
    expect(parseReading('n/a')).toBeNull();
  });
});

describe('assessMetric', () => {
  it('REGRESSION: 28.5°C is within the safe range', () => {
    const r = assessMetric('temp', '28.5°C', 'Assisted-Growing');
    expect(r.level).toBe('OK');
    expect(r.chip).toBe('Trong ngưỡng');
    expect(r.action).toBe('');
  });

  it('classifies below / above the safe range in plain words', () => {
    expect(assessMetric('soilMoisture', '52%').level).toBe('LOW');
    expect(assessMetric('soilMoisture', '52%').chip).toBe('Dưới ngưỡng');
    expect(assessMetric('soilMoisture', '82%').level).toBe('HIGH');
    expect(assessMetric('soilMoisture', '82%').chip).toBe('Vượt ngưỡng');
  });

  it('converts lux to thousands so 45.000 Lux is fine', () => {
    const r = assessMetric('light', '45.000 Lux');
    expect(r.value).toBe(45);
    expect(r.level).toBe('OK');
  });

  it('tells WHO acts depending on the cultivation mode', () => {
    expect(assessMetric('soilMoisture', '50%', 'Assisted-Growing').action).toMatch(/^Farmely/);
    expect(assessMetric('soilMoisture', '50%', 'Self-Growing').action).toMatch(/^Bạn/);
  });

  it('places the safe band in the middle of the gauge and clamps the ends', () => {
    expect(assessMetric('soilMoisture', '60%').position).toBeCloseTo(0.25);
    expect(assessMetric('soilMoisture', '75%').position).toBeCloseTo(0.75);
    expect(assessMetric('soilMoisture', '0%').position).toBe(0.02);
    expect(assessMetric('soilMoisture', '200%').position).toBe(0.98);
  });

  it('never throws on missing data', () => {
    const r = assessMetric('temp', undefined);
    expect(r.level).toBe('UNKNOWN');
    expect(r.position).toBeNull();
  });
});

describe('summarizePlot', () => {
  it('reassures when everything is fine', () => {
    const s = summarizePlot({ temp: '28.5°C', soilMoisture: '68%', airHumidity: '74%', light: '45.000 Lux' });
    expect(s.tone).toBe('OK');
    expect(s.headline).toMatch(/Mọi thứ đang ổn/);
  });
  it('REGRESSION: never says "all fine" while an urgent alert is active', () => {
    const plot = { temp: '28.5°C', soilMoisture: '68%', airHumidity: '74%', light: '45.000 Lux' };
    const s = summarizePlot(plot, [{ level: 'HIGH', title: 'Mưa có thể đến sau 45 phút' }]);
    expect(s.tone).toBe('WARN');
    expect(s.headline).not.toMatch(/Mọi thứ đang ổn/);
    expect(s.headline).toContain('mưa có thể đến sau 45 phút');
    // Cảnh báo mức thấp/trung bình không làm đổi giọng tóm tắt
    expect(summarizePlot(plot, [{ level: 'MEDIUM', title: 'x' }]).tone).toBe('OK');
  });

  it('names exactly the metrics that need attention', () => {
    const s = summarizePlot({ temp: '35°C', soilMoisture: '50%', airHumidity: '74%', light: '45.000 Lux' });
    expect(s.tone).toBe('WARN');
    expect(s.headline).toContain('nhiệt độ đang cao');
    expect(s.headline).toContain('độ ẩm đất đang thấp');
    expect(s.headline).toContain('2/4');
  });
});

describe('computeHealthScore', () => {
  const fine = { temp: '28.5°C', soilMoisture: '68%', airHumidity: '74%', light: '45.000 Lux' };
  it('is 100 when everything is in range and there are no alerts', () => {
    expect(computeHealthScore(fine)).toEqual({ score: 100, label: 'Rất tốt', tone: 'OK' });
  });
  it('drops with urgent alerts and out-of-range metrics, clamped at 0', () => {
    expect(computeHealthScore(fine, [{ level: 'HIGH' }, { level: 'MEDIUM' }]).score).toBe(80);
    expect(computeHealthScore({ ...fine, temp: '40°C', soilMoisture: '20%' }).label).toBe('Cần chú ý');
    expect(computeHealthScore(fine, Array(10).fill({ level: 'HIGH' })).score).toBe(0);
  });
  it('reports unknown when no sensor data exists', () => {
    expect(computeHealthScore({}).score).toBeNull();
  });
});

describe('explainAlert', () => {
  it('turns a raw rain alert into advice for the right person', () => {
    const a = { level: 'HIGH', title: 'Mưa có thể đến sau 45 phút', metric: 'Dự báo mưa 8.2 mm', time: '5 phút trước' };
    expect(explainAlert(a, 'Assisted-Growing').action).toMatch(/Farmely đã hoãn lịch tưới/);
    expect(explainAlert(a, 'Self-Growing').action).toMatch(/Bạn không cần tưới/);
    expect(explainAlert(a).levelText).toBe('Cần xử lý sớm');
  });
  it('falls back gracefully for unknown alerts', () => {
    const r = explainAlert({ level: 'LOW', title: 'Pin cảm biến yếu' }, 'Self-Growing');
    expect(r.explanation).toBeTruthy();
    expect(r.action).toMatch(/^Bạn/);
  });
});

describe('describeSeries', () => {
  const day = [
    { time: '08:00', temp: 27.8 },
    { time: '12:00', temp: 33.2 },
    { time: '20:00', temp: 26.1 }
  ];
  it('describes range, peak time and out-of-range moments', () => {
    const s = describeSeries('temp', day, 'temp');
    expect(s).toContain('26.1°C');
    expect(s).toContain('33.2°C');
    expect(s).toContain('cao nhất lúc 12:00');
    expect(s).toContain('1 thời điểm ra khỏi vùng an toàn (12:00)');
  });
  it('does not flag zero light at night as a problem', () => {
    const s = describeSeries('light', [{ time: '00:00', light: 0 }, { time: '12:00', light: 45 }], 'light');
    expect(s).toContain('Luôn nằm trong vùng an toàn');
  });
});
