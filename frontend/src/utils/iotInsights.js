/**
 * IOT INSIGHTS — Dịch số liệu cảm biến sang lời nói dễ hiểu cho khách hàng.
 *
 * Khách thuê đất không cần biết "74% RH" hay "45.000 Lux" là tốt hay xấu.
 * Mỗi chỉ số được so với vùng an toàn và trả về: trong ngưỡng / dưới ngưỡng /
 * vượt ngưỡng, kèm 1 câu giải thích ý nghĩa với cây và 1 câu "cần làm gì".
 * Câu "cần làm gì" đổi theo mô hình: Farmely chăm sóc hay khách tự canh tác.
 */

/** Đọc số từ chuỗi hiển thị: '28.5°C' -> 28.5, '45.000 Lux' -> 45000, '68%' -> 68 */
export function parseReading(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value ?? '').trim();
  const m = s.match(/-?\d[\d.,]*/);
  if (!m) return null;
  let token = m[0];
  if (/^\d{1,3}(\.\d{3})+$/.test(token)) token = token.replace(/\./g, ''); // 45.000 -> 45000
  else if (/^\d{1,3}(,\d{3})+$/.test(token)) token = token.replace(/,/g, ''); // 45,000 -> 45000
  else token = token.replace(',', '.'); // 28,5 -> 28.5
  const n = parseFloat(token);
  return Number.isFinite(n) ? n : null;
}

/**
 * Vùng an toàn chung cho rau màu (đơn vị hiển thị cho khách).
 * light đo theo "nghìn lux" để con số gọn: 45.000 Lux -> 45.
 */
export const METRIC_RULES = {
  temp: {
    label: 'Nhiệt độ',
    unit: '°C',
    min: 18,
    max: 32,
    toDisplay: (n) => n,
    meaning: {
      OK: 'Nhiệt độ dễ chịu, cây phát triển bình thường.',
      LOW: 'Trời lạnh hơn mức cây ưa thích, cây sẽ lớn chậm lại.',
      HIGH: 'Trời nóng hơn mức cây chịu được, lá dễ héo vào buổi trưa.'
    },
    action: {
      LOW: { managed: 'Farmely sẽ che phủ giữ ấm cho luống nếu lạnh kéo dài.', self: 'Bạn có thể phủ rơm hoặc màng che để giữ ấm cho luống.' },
      HIGH: { managed: 'Farmely sẽ tưới làm mát và che lưới vào buổi trưa.', self: 'Bạn nên tưới vào sáng sớm và che bớt nắng buổi trưa.' }
    }
  },
  soilMoisture: {
    label: 'Độ ẩm đất',
    unit: '%',
    min: 60,
    max: 75,
    toDisplay: (n) => n,
    meaning: {
      OK: 'Đất đủ ẩm, cây không cần tưới thêm lúc này.',
      LOW: 'Đất đang khô, rễ cây thiếu nước.',
      HIGH: 'Đất quá ướt, rễ cây dễ bị úng và thối.'
    },
    action: {
      LOW: { managed: 'Farmely sẽ tưới bổ sung trong hôm nay.', self: 'Bạn nên tưới thêm cho thửa trong hôm nay.' },
      HIGH: { managed: 'Farmely đã tạm ngưng lịch tưới để đất ráo bớt.', self: 'Bạn nên tạm ngưng tưới và kiểm tra rãnh thoát nước.' }
    }
  },
  airHumidity: {
    label: 'Độ ẩm không khí',
    unit: '%',
    min: 55,
    max: 85,
    toDisplay: (n) => n,
    meaning: {
      OK: 'Không khí ẩm vừa phải, lá cây khoẻ.',
      LOW: 'Không khí khô, lá cây mất nước nhanh hơn.',
      HIGH: 'Không khí rất ẩm, dễ phát sinh nấm bệnh trên lá.'
    },
    action: {
      LOW: { managed: 'Farmely sẽ phun sương nhẹ cho lá.', self: 'Bạn có thể phun sương nhẹ lên lá vào buổi chiều.' },
      HIGH: { managed: 'Farmely sẽ tỉa bớt lá cho thông thoáng và theo dõi nấm bệnh.', self: 'Bạn nên tỉa bớt lá già để luống thông thoáng.' }
    }
  },
  light: {
    label: 'Ánh sáng',
    unit: 'nghìn lux',
    min: 20,
    max: 60,
    toDisplay: (n) => (n > 1000 ? n / 1000 : n),
    meaning: {
      OK: 'Cây nhận đủ ánh nắng để quang hợp.',
      LOW: 'Cây đang thiếu nắng, có thể vươn cao và lá nhạt màu.',
      HIGH: 'Nắng rất gắt, lá non dễ bị cháy.'
    },
    action: {
      LOW: { managed: 'Farmely sẽ tỉa cây che bóng xung quanh thửa nếu cần.', self: 'Bạn nên dọn bớt vật che bóng quanh thửa.' },
      HIGH: { managed: 'Farmely sẽ kéo lưới che nắng vào giữa trưa.', self: 'Bạn nên che lưới cho luống vào giữa trưa.' }
    }
  }
};

export const METRIC_ORDER = ['temp', 'soilMoisture', 'airHumidity', 'light'];

export const LEVEL_TEXT = {
  OK: { chip: 'Trong ngưỡng', short: 'Ổn định' },
  LOW: { chip: 'Dưới ngưỡng', short: 'Thấp' },
  HIGH: { chip: 'Vượt ngưỡng', short: 'Cao' },
  UNKNOWN: { chip: 'Chưa có dữ liệu', short: '—' }
};

const isManaged = (mode) => mode !== 'Self-Growing';

/**
 * Đánh giá 1 chỉ số.
 * @returns {{ key, label, value, unit, level, chip, meaning, action, position, min, max }}
 *  position: 0..1 vị trí của giá trị trên thanh đo (vùng an toàn nằm giữa 0.25..0.75)
 */
export function assessMetric(key, rawValue, mode) {
  const rule = METRIC_RULES[key];
  if (!rule) throw new Error(`Unknown metric: ${key}`);
  const parsed = parseReading(rawValue);
  const value = parsed === null ? null : rule.toDisplay(parsed);

  let level = 'UNKNOWN';
  if (value !== null) level = value < rule.min ? 'LOW' : value > rule.max ? 'HIGH' : 'OK';

  // Thanh đo: ngưỡng dưới ở 25%, ngưỡng trên ở 75%, kẹp trong [0.02, 0.98]
  let position = null;
  if (value !== null) {
    const span = rule.max - rule.min;
    position = 0.25 + ((value - rule.min) / span) * 0.5;
    position = Math.min(0.98, Math.max(0.02, position));
  }

  const action = level === 'LOW' || level === 'HIGH'
    ? rule.action[level][isManaged(mode) ? 'managed' : 'self']
    : '';

  return {
    key,
    label: rule.label,
    value,
    unit: rule.unit,
    level,
    chip: LEVEL_TEXT[level].chip,
    meaning: level === 'UNKNOWN' ? 'Cảm biến chưa gửi số liệu.' : rule.meaning[level],
    action,
    position,
    min: rule.min,
    max: rule.max
  };
}

/** Đánh giá cả 4 chỉ số của 1 thửa */
export function assessPlot(plot) {
  return METRIC_ORDER.map((key) => assessMetric(key, plot?.[key], plot?.mode));
}

/**
 * Điểm sức khoẻ 0–100 cho 1 thửa, để khách nhìn 1 con số là hiểu.
 * = tỉ lệ chỉ số trong ngưỡng × 100, trừ 15 điểm mỗi cảnh báo cao, 5 điểm mỗi cảnh báo vừa.
 */
export function computeHealthScore(plot, alerts = []) {
  const known = assessPlot(plot).filter((i) => i.level !== 'UNKNOWN');
  if (!known.length) return { score: null, label: 'Chưa có dữ liệu', tone: 'UNKNOWN' };
  const ok = known.filter((i) => i.level === 'OK').length;
  const penalty = (alerts || []).reduce((n, a) => n + (a?.level === 'HIGH' ? 15 : a?.level === 'MEDIUM' ? 5 : 0), 0);
  const score = Math.max(0, Math.min(100, Math.round((ok / known.length) * 100 - penalty)));
  if (score >= 85) return { score, label: 'Rất tốt', tone: 'OK' };
  if (score >= 65) return { score, label: 'Khá ổn', tone: 'WARN' };
  return { score, label: 'Cần chú ý', tone: 'BAD' };
}

/**
 * Câu tóm tắt tình trạng thửa: "Mọi chỉ số đều ổn" / "Cần chú ý: ...".
 * Phải tính cả cảnh báo mức cao: không được nói "mọi thứ ổn" ngay phía trên
 * một cảnh báo "Cần xử lý sớm".
 */
export function summarizePlot(plot, alerts = []) {
  const items = assessPlot(plot);
  const known = items.filter((i) => i.level !== 'UNKNOWN');
  const off = known.filter((i) => i.level !== 'OK');
  const urgent = (alerts || []).filter((a) => a?.level === 'HIGH');

  if (!known.length) {
    return { tone: 'UNKNOWN', headline: 'Chưa nhận được số liệu từ cảm biến của thửa này.', items };
  }
  if (!off.length && urgent.length) {
    const first = urgent[0].title.charAt(0).toLowerCase() + urgent[0].title.slice(1);
    return {
      tone: 'WARN',
      headline: `Các chỉ số của cây đang ổn, nhưng có ${urgent.length} cảnh báo cần chú ý: ${first}${urgent.length > 1 ? '…' : '.'}`,
      items
    };
  }
  if (!off.length) {
    return {
      tone: 'OK',
      headline: 'Mọi thứ đang ổn. Cả nhiệt độ, độ ẩm và ánh sáng đều trong ngưỡng an toàn cho cây.',
      items
    };
  }
  const parts = off.map((i) => `${i.label.toLowerCase()} ${i.level === 'HIGH' ? 'đang cao' : 'đang thấp'}`);
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} và ${parts[parts.length - 1]}`;
  return {
    tone: 'WARN',
    headline: `Cần chú ý: ${list}. ${known.length - off.length}/${known.length} chỉ số còn lại vẫn ổn.`,
    items
  };
}

/** Diễn giải 1 cảnh báo thô (từ trạm IoT) thành lời khuyên */
const ALERT_RULES = [
  { test: /mưa/i, explain: 'Sắp có mưa nên đất sẽ tự đủ ẩm.', managed: 'Farmely đã hoãn lịch tưới hôm nay.', self: 'Bạn không cần tưới hôm nay và nên che phủ những luống cây non.' },
  { test: /gió/i, explain: 'Gió mạnh có thể làm giàn và cây lung lay, gãy ngọn.', managed: 'Farmely sẽ kiểm tra và gia cố dây buộc giàn.', self: 'Bạn nên kiểm tra và buộc chặt giàn, cọc đỡ.' },
  { test: /độ ẩm đất.*(tăng|cao)/i, explain: 'Đất đang ướt lên nhanh, rễ có nguy cơ bị úng.', managed: 'Farmely đã tạm dừng tưới và theo dõi thêm.', self: 'Bạn nên tạm ngưng tưới và khơi rãnh thoát nước.' },
  { test: /độ ẩm đất.*(thấp|giảm)|gần ngưỡng thấp/i, explain: 'Đất sắp khô hơn mức cây cần.', managed: 'Farmely sẽ tưới bổ sung nếu chỉ số tiếp tục giảm.', self: 'Bạn nên tưới thêm vào sáng sớm hoặc chiều mát.' },
  { test: /nắng|lux|ánh sáng/i, explain: 'Nắng gắt vào giữa trưa có thể làm cháy lá non.', managed: 'Farmely sẽ kéo lưới che nắng vào giờ cao điểm.', self: 'Bạn nên che lưới cho luống từ 11 giờ đến 14 giờ.' },
  { test: /nhiệt độ|nóng/i, explain: 'Trời nóng hơn bình thường, cây mất nước nhanh hơn.', managed: 'Farmely sẽ tăng tưới làm mát vào sáng sớm.', self: 'Bạn nên tưới sáng sớm và tránh tưới giữa trưa.' }
];

export const ALERT_LEVEL_TEXT = {
  HIGH: 'Cần xử lý sớm',
  MEDIUM: 'Nên để ý',
  LOW: 'Thông tin'
};

export function explainAlert(alert, mode) {
  const rule = ALERT_RULES.find((r) => r.test.test(`${alert?.title || ''} ${alert?.metric || ''}`));
  const managed = isManaged(mode);
  return {
    title: alert?.title || 'Cảnh báo từ trạm IoT',
    levelText: ALERT_LEVEL_TEXT[alert?.level] || ALERT_LEVEL_TEXT.MEDIUM,
    explanation: rule?.explain || 'Trạm cảm biến ghi nhận một thay đổi bất thường tại thửa.',
    action: rule ? (managed ? rule.managed : rule.self) : (managed ? 'Kỹ sư Farmely đang theo dõi và sẽ báo bạn nếu cần.' : 'Bạn nên ghé kiểm tra thửa khi có thể.'),
    detail: alert?.metric || '',
    time: alert?.time || ''
  };
}

/**
 * Mô tả 1 chuỗi số liệu theo thời gian thành câu: khoảng dao động, lúc cao nhất,
 * và có lúc nào ra khỏi vùng an toàn hay không.
 * @param {string} key metric key
 * @param {Array<object>} data điểm dữ liệu (field theo seriesField)
 * @param {string} seriesField tên field trong data (vd 'temp', 'moisture')
 */
export function describeSeries(key, data, seriesField) {
  const rule = METRIC_RULES[key];
  const pts = (data || []).filter((d) => Number.isFinite(d?.[seriesField]));
  if (!rule || !pts.length) return '';
  const vals = pts.map((d) => d[seriesField]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const peak = pts[vals.indexOf(max)];
  const fmt = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}${rule.unit === '%' || rule.unit === '°C' ? rule.unit : ` ${rule.unit}`}`;
  const outside = pts.filter((d) => d[seriesField] < rule.min || d[seriesField] > rule.max);

  // Ánh sáng ban đêm = 0 là bình thường, không tính là "dưới ngưỡng"
  const outsideReal = key === 'light' ? outside.filter((d) => d[seriesField] > rule.max) : outside;

  let sentence = `${rule.label} dao động từ ${fmt(min)} đến ${fmt(max)}, cao nhất lúc ${peak.time}.`;
  sentence += outsideReal.length
    ? ` Có ${outsideReal.length} thời điểm ra khỏi vùng an toàn (${outsideReal.map((d) => d.time).join(', ')}).`
    : ' Luôn nằm trong vùng an toàn.';
  return sentence;
}
