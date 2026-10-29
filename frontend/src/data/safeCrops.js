export const safeCrops = [
  {
    id: 'CRP-01',
    varietyId: 1,
    name: 'Rau muống cạn',
    variety: 'Rau muống lá tre F1',
    icon: '🌿',
    duration: '25–30 ngày',
    minDays: 34,
    temperature: '25–35°C',
    soilMoisture: '70–85%'
  },
  {
    id: 'CRP-02',
    varietyId: 2,
    name: 'Cải ngọt / Cải bẹ',
    variety: 'Cải ngọt bông F1',
    icon: '🥬',
    duration: '30–35 ngày',
    minDays: 39,
    temperature: '22–32°C',
    soilMoisture: '65–75%'
  },
  {
    id: 'CRP-03',
    varietyId: 3,
    name: 'Xà lách xoăn',
    variety: 'Lollo Bionda / Romaine',
    icon: '🥗',
    duration: '40–45 ngày',
    minDays: 49,
    temperature: '18–28°C',
    soilMoisture: '60–70%'
  },
  {
    id: 'CRP-04',
    varietyId: 4,
    name: 'Cà chua bi',
    variety: 'Cà chua bi đỏ F1',
    icon: '🍅',
    duration: '75–85 ngày',
    minDays: 87,
    temperature: '20–30°C',
    soilMoisture: '65–75%'
  },
  {
    id: 'CRP-05',
    varietyId: 5,
    name: 'Dưa leo baby',
    variety: 'Dưa leo baby F1',
    icon: '🥒',
    duration: '50–60 ngày',
    minDays: 60,
    temperature: '25–32°C',
    soilMoisture: '70–80%'
  },
  {
    id: 'CRP-06',
    varietyId: 6,
    name: 'Đậu cô ve',
    variety: 'Đậu cô ve lùn / leo',
    icon: '🫛',
    duration: '50–55 ngày',
    minDays: 60,
    temperature: '20–30°C',
    soilMoisture: '65–75%'
  },
  {
    id: 'CRP-07',
    varietyId: 7,
    name: 'Mướp hương',
    variety: 'Mướp hương cao sản',
    icon: '🌱',
    duration: '60–70 ngày',
    minDays: 72,
    temperature: '25–35°C',
    soilMoisture: '70–80%'
  },
  {
    id: 'CRP-08',
    varietyId: 8,
    name: 'Rau mồng tơi',
    variety: 'Mồng tơi lá to F1',
    icon: '🍃',
    duration: '30–35 ngày',
    minDays: 39,
    temperature: '25–35°C',
    soilMoisture: '70–85%'
  },
  {
    id: 'CRP-09',
    varietyId: 9,
    name: 'Ớt cay / Ớt chỉ thiên',
    variety: 'Ớt chỉ thiên F1',
    icon: '🌶️',
    duration: '75–90 ngày',
    minDays: 92,
    temperature: '22–32°C',
    soilMoisture: '65–75%'
  },
  {
    id: 'CRP-10',
    varietyId: 10,
    name: 'Rau dền',
    variety: 'Rau dền đỏ F1',
    icon: '🌾',
    duration: '25–30 ngày',
    minDays: 34,
    temperature: '25–35°C',
    soilMoisture: '65–80%'
  }
];

let dynamicCropsRegistry = [...safeCrops];

export function mergeVarietiesIntoSafeCrops(varieties = []) {
  if (!Array.isArray(varieties) || varieties.length === 0) return [...dynamicCropsRegistry];
  const result = [...dynamicCropsRegistry];
  const existingVarietyIds = new Set(result.map((c) => Number(c.varietyId)));

  varieties.forEach((v) => {
    const vId = Number(v.varietyId ?? v.id);
    if (!Number.isFinite(vId) || existingVarietyIds.has(vId)) return;

    const padId = `CRP-${String(vId).padStart(2, '0')}`;
    const cName = v.cropName || v.crop_name || v.name || 'Cây trồng';
    const vName = v.varietyName || v.variety_name || v.name || 'Giống VietGAP';
    const durationDays = Number(v.growthDuration || v.expectedDuration || v.duration || 45);

    result.push({
      id: padId,
      varietyId: vId,
      cropId: v.cropId || v.crop_id,
      name: cName,
      variety: vName,
      icon: '🌱',
      duration: `${durationDays} ngày`,
      minDays: durationDays,
      temperature: '20–32°C',
      soilMoisture: '65–75%'
    });
    existingVarietyIds.add(vId);
  });

  return result;
}

export function registerDynamicCrops(varieties = []) {
  dynamicCropsRegistry = mergeVarietiesIntoSafeCrops(varieties);
  return [...dynamicCropsRegistry];
}

export function getSafeCropsList() {
  return [...dynamicCropsRegistry];
}

export const getSafeCropById = (cropId) => {
  if (!cropId) return undefined;
  const idStr = String(cropId).trim().toUpperCase();
  return (
    dynamicCropsRegistry.find(
      (crop) =>
        crop.id.toUpperCase() === idStr ||
        String(crop.varietyId) === String(cropId) ||
        crop.name.toLowerCase() === idStr.toLowerCase() ||
        crop.variety.toLowerCase() === idStr.toLowerCase()
    ) ||
    safeCrops.find(
      (crop) =>
        crop.id.toUpperCase() === idStr ||
        String(crop.varietyId) === String(cropId)
    )
  );
};

