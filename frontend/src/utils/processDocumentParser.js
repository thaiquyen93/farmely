/**
 * Module phân tích tài liệu kỹ thuật nông nghiệp chuẩn VietGAP
 * Hỗ trợ định dạng: .txt (văn bản cấu trúc hóa) và .json (dữ liệu máy đọc)
 */

export function parseProcessDocument(rawText, availableVarieties = []) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Nội dung tài liệu trống hoặc không đúng định dạng');
  }

  const trimmed = rawText.trim();

  // 1. Thử parse dạng JSON nếu bắt đầu bằng { hoặc [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      return normalizeParsedData(data, availableVarieties);
    } catch (err) {
      // Nếu không parse được JSON thì chuyển sang parse text
    }
  }

  // 2. Parse dạng TEXT / MARKDOWN có cấu trúc
  return parseStructuredText(trimmed, availableVarieties);
}

function parseStructuredText(text, availableVarieties) {
  const lines = text.split(/\r?\n/);
  
  let name = '';
  let varietyName = '';
  let version = 'v1.0';
  let status = 'ACTIVE';
  let description = '';
  let totalDays = 45;

  const steps = [];
  let currentStep = null;

  const pushCurrentStep = () => {
    if (currentStep && (currentStep.stepName || currentStep.name)) {
      steps.push({
        ...currentStep,
        stepNumber: steps.length + 1,
        stepName: currentStep.stepName || currentStep.name || `Bước kỹ thuật #${steps.length + 1}`,
        dayOffset: parseInt(currentStep.dayOffset !== undefined ? currentStep.dayOffset : 0, 10) || 0,
        taskType: mapTaskType(currentStep.taskType || currentStep.type),
        durationMinutes: parseInt(currentStep.durationMinutes || 60, 10) || 60,
        durationDays: Math.max(1, Math.ceil((parseInt(currentStep.durationMinutes || 60, 10) || 60) / 60)),
        description: (currentStep.description || currentStep.details || '').trim(),
        materialsNeeded: (currentStep.materialsNeeded || currentStep.materials || '').trim(),
        minTemp: currentStep.minTemp ? parseFloat(currentStep.minTemp) : null,
        maxTemp: currentStep.maxTemp ? parseFloat(currentStep.maxTemp) : null,
        minHumidity: currentStep.minHumidity ? parseFloat(currentStep.minHumidity) : null,
        maxHumidity: currentStep.maxHumidity ? parseFloat(currentStep.maxHumidity) : null,
      });
      currentStep = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) {
      // Header comment: kiểm tra xem có tiêu đề chính không
      if (!name && rawLine.startsWith('#') && !rawLine.startsWith('##') && rawLine.length > 5) {
        name = rawLine.replace(/^#+\s*/, '').trim();
      }
      continue;
    }

    // Nhận diện mốc bước mới dạng [BƯỚC ...], [STEP ...], BƯỚC ...:
    if (/^\[?\s*(?:BƯỚC|STEP)\s*\d+.*\]?/i.test(rawLine)) {
      pushCurrentStep();
      currentStep = {};
      continue;
    }

    // Tách cặp Key: Value
    const colonIdx = rawLine.indexOf(':');
    if (colonIdx !== -1) {
      const key = rawLine.substring(0, colonIdx).trim().toUpperCase();
      const val = rawLine.substring(colonIdx + 1).trim();

      if (currentStep) {
        // Thuộc tính của Bước hiện tại
        if (key.includes('NGÀY') || key.includes('DAY') || key.includes('OFFSET')) {
          const num = val.match(/\d+/);
          currentStep.dayOffset = num ? parseInt(num[0], 10) : 0;
        } else if (key.includes('TÊN') || key.includes('NAME') || key.includes('CÔNG_VIỆC')) {
          currentStep.stepName = val;
        } else if (key.includes('LOẠI') || key.includes('TYPE')) {
          currentStep.taskType = val;
        } else if (key.includes('THỜI_LƯỢNG') || key.includes('DURATION') || key.includes('PHÚT')) {
          const num = val.match(/\d+/);
          currentStep.durationMinutes = num ? parseInt(num[0], 10) : 60;
        } else if (key.includes('VẬT_TƯ') || key.includes('CHẾ_PHẨM') || key.includes('MATERIAL')) {
          currentStep.materialsNeeded = val;
        } else if (key.includes('HƯỚNG_DẪN') || key.includes('MÔ_TẢ') || key.includes('DESC') || key.includes('THAO_TÁC')) {
          currentStep.description = val;
        } else if (key.includes('NHIỆT_ĐỘ') || key.includes('TEMP')) {
          const nums = val.match(/\d+(?:\.\d+)?/g);
          if (nums && nums.length >= 2) {
            currentStep.minTemp = nums[0];
            currentStep.maxTemp = nums[1];
          } else if (nums && nums.length === 1) {
            currentStep.minTemp = nums[0];
          }
        } else if (key.includes('ĐỘ_ẨM') || key.includes('HUMIDITY')) {
          const nums = val.match(/\d+(?:\.\d+)?/g);
          if (nums && nums.length >= 2) {
            currentStep.minHumidity = nums[0];
            currentStep.maxHumidity = nums[1];
          } else if (nums && nums.length === 1) {
            currentStep.minHumidity = nums[0];
          }
        }
      } else {
        // Thuộc tính chung của Quy Trình
        if (key.includes('GIỐNG') || key.includes('VARIETY')) {
          varietyName = val;
        } else if (key.includes('TÊN') || key.includes('NAME') || key.includes('QUY_TRÌNH')) {
          name = val;
        } else if (key.includes('PHIÊN_BẢN') || key.includes('VERSION')) {
          version = val;
        } else if (key.includes('TRẠNG_THÁI') || key.includes('STATUS')) {
          status = val.toUpperCase().includes('ACTIVE') ? 'ACTIVE' : (val.toUpperCase().includes('DRAFT') ? 'DRAFT' : 'ARCHIVED');
        } else if (key.includes('CHU_KỲ') || key.includes('DURATION') || key.includes('DAYS')) {
          const num = val.match(/\d+/);
          if (num) totalDays = parseInt(num[0], 10);
        } else if (key.includes('MÔ_TẢ') || key.includes('DESC')) {
          description = val;
        }
      }
    } else if (currentStep && currentStep.description) {
      // Dòng mô tả nhiều hàng
      currentStep.description += ' ' + rawLine;
    }
  }

  // Đẩy bước cuối cùng nếu có
  pushCurrentStep();

  return normalizeParsedData({
    name: name || (varietyName ? `Quy trình kỹ thuật chuẩn VietGAP - ${varietyName}` : 'Quy trình canh tác chuẩn VietGAP'),
    varietyName,
    version: version || 'v1.0',
    status: status || 'ACTIVE',
    description: description || `Quy trình canh tác kỹ thuật công nghệ cao chuẩn VietGAP cho giống ${varietyName || 'cây trồng'}.`,
    totalDays,
    steps
  }, availableVarieties);
}

function normalizeParsedData(data, availableVarieties) {
  let matchedVariety = null;
  const rawVarietyStr = String(data.varietyName || data.variety || data.cropName || data.crop || '').toLowerCase().trim();

  if (availableVarieties && availableVarieties.length > 0) {
    // 1. Khớp chính xác ID nếu có
    if (data.varietyId) {
      matchedVariety = availableVarieties.find(v => String(v.id || v.varietyId) === String(data.varietyId));
    }
    // 2. Khớp chuỗi theo tên giống hoặc cây trồng
    if (!matchedVariety && rawVarietyStr) {
      matchedVariety = availableVarieties.find(v => {
        const vName = (v.name || v.varietyName || '').toLowerCase();
        const cName = (v.cropName || '').toLowerCase();
        return vName.includes(rawVarietyStr) || rawVarietyStr.includes(vName) || cName.includes(rawVarietyStr) || rawVarietyStr.includes(cName);
      });
    }
    // 3. Fallback giống đầu tiên nếu không khớp
    if (!matchedVariety) {
      matchedVariety = availableVarieties[0];
    }
  }

  const varietyId = matchedVariety ? String(matchedVariety.id || matchedVariety.varietyId) : '1';
  const varietyName = matchedVariety ? (matchedVariety.name || matchedVariety.varietyName) : (data.varietyName || 'Giống cây VietGAP');
  const cropName = matchedVariety ? matchedVariety.cropName : (data.cropName || 'Rau củ');

  const rawSteps = Array.isArray(data.steps) ? data.steps : [];
  const normalizedSteps = rawSteps.map((step, idx) => ({
    stepNumber: idx + 1,
    stepName: step.stepName || step.taskName || step.name || `Bước kỹ thuật #${idx + 1}`,
    dayOffset: parseInt(step.dayOffset !== undefined ? step.dayOffset : (step.day !== undefined ? step.day : idx * 5), 10) || 0,
    taskType: mapTaskType(step.taskType || step.type),
    durationMinutes: parseInt(step.durationMinutes || (step.durationDays ? step.durationDays * 60 : 60), 10) || 60,
    durationDays: Math.max(1, Math.ceil((parseInt(step.durationMinutes || 60, 10) || 60) / 60)),
    description: (step.description || step.details || 'Chăm sóc theo quy trình VietGAP').trim(),
    materialsNeeded: (step.materialsNeeded || step.materialsRequired || step.materials || '').trim(),
    minTemp: step.minTemp !== undefined && step.minTemp !== null && step.minTemp !== '' ? parseFloat(step.minTemp) : null,
    maxTemp: step.maxTemp !== undefined && step.maxTemp !== null && step.maxTemp !== '' ? parseFloat(step.maxTemp) : null,
    minHumidity: step.minHumidity !== undefined && step.minHumidity !== null && step.minHumidity !== '' ? parseFloat(step.minHumidity) : null,
    maxHumidity: step.maxHumidity !== undefined && step.maxHumidity !== null && step.maxHumidity !== '' ? parseFloat(step.maxHumidity) : null
  })).sort((a, b) => Number(a.dayOffset) - Number(b.dayOffset));

  return {
    name: data.name || `Quy trình chuẩn VietGAP - ${varietyName}`,
    varietyId,
    varietyName,
    cropName,
    version: data.version || 'v2.5 (Chuẩn VietGAP)',
    status: data.status || 'ACTIVE',
    description: data.description || `Quy trình kỹ thuật nông nghiệp chuẩn VietGAP được ban hành chính thức cho giống ${varietyName}.`,
    totalDays: data.totalDays || (normalizedSteps.length > 0 ? Math.max(...normalizedSteps.map(s => s.dayOffset)) + 7 : 55),
    steps: normalizedSteps
  };
}

function mapTaskType(raw) {
  if (!raw) return 'CARE';
  const str = String(raw).toUpperCase().trim();
  if (str.includes('SOIL') || str.includes('ĐẤT') || str.includes('LÀM ĐẤT') || str.includes('KHỬ CHUA')) return 'SOIL_PREP';
  if (str.includes('PLANT') || str.includes('GIỐNG') || str.includes('CẤY') || str.includes('GIEO')) return 'PLANTING';
  if (str.includes('IRRIGAT') || str.includes('TƯỚI') || str.includes('NƯỚC')) return 'IRRIGATION';
  if (str.includes('FERTILIZ') || str.includes('BÓN') || str.includes('PHÂN') || str.includes('DINH DƯỠNG')) return 'FERTILIZATION';
  if (str.includes('PEST') || str.includes('SÂU') || str.includes('BỆNH') || str.includes('PHÒNG TRỪ') || str.includes('TỎI ỚT')) return 'PEST_CONTROL';
  if (str.includes('PRUN') || str.includes('TỈA') || str.includes('GIÀN') || str.includes('BẤM NGỌN')) return 'PRUNING';
  if (str.includes('SAFETY') || str.includes('CÁCH LY') || str.includes('INTERVAL')) return 'SAFETY_INTERVAL';
  if (str.includes('HARVEST') || str.includes('THU HOẠCH') || str.includes('HÁI') || str.includes('CÂN ĐO')) return 'HARVEST';
  return 'CARE';
}
