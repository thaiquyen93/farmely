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

export const getSafeCropById = (cropId) => safeCrops.find((crop) => crop.id === cropId);

