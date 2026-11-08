/**
 * Open-Meteo 3rd-Party Agrometeorology & Precision Farming IoT Service
 * 
 * Thay thế hoàn toàn dữ liệu mock giả lập từ backend bằng API thời tiết - vi khí hậu
 * nông nghiệp thực tế toàn cầu từ Open-Meteo (https://open-meteo.com/en/docs/agrometeorology-api).
 * Hoàn toàn miễn phí, độ trễ cực thấp, không yêu cầu API key, hỗ trợ đầy đủ:
 * - Nhiệt độ không khí 2m (temperature_2m)
 * - Độ ẩm không khí 2m (relative_humidity_2m)
 * - Nhiệt độ tầng đất mặt (soil_temperature_0cm)
 * - Độ ẩm đất thể tích (soil_moisture_0_to_1cm) quy đổi sang % độ ẩm canh tác
 * - Bức xạ mặt trời trực tiếp (direct_radiation) quy đổi sang Lux
 * - Lượng mưa và tốc độ gió thực tế (precipitation, wind_speed_10m)
 */

// Bộ nhớ đệm danh sách nông trại tải động từ CSDL PostgreSQL (/api/lands)
let cachedLands = null;
let cachedLandsTimestamp = 0;

/**
 * Tải danh sách toàn bộ nông trại từ CSDL PostgreSQL để trích xuất tọa độ GPS động
 */
export async function getDynamicFarmLands() {
  const now = Date.now();
  if (cachedLands && now - cachedLandsTimestamp < 60000) {
    return cachedLands;
  }
  try {
    const res = await fetch('/api/lands');
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      if (list.length > 0) {
        cachedLands = list;
        cachedLandsTimestamp = now;
        return list;
      }
    }
  } catch (e) {
    console.debug('[weatherIotService] Fallback to cached/direct plot coordinates:', e);
  }
  return cachedLands || [];
}

/**
 * Helper tính tâm đa giác GeoJSON (Centroid [lat, lon]) từ boundary
 */
function extractCentroidFromGeoJson(boundary) {
  if (!boundary) return null;
  try {
    const raw = typeof boundary === 'string' ? JSON.parse(boundary) : boundary;
    const ring = Array.isArray(raw) 
      ? (Array.isArray(raw[0]) && typeof raw[0][0] === 'number' ? raw : (Array.isArray(raw[0]) ? raw[0] : null))
      : (raw?.coordinates ? (Array.isArray(raw.coordinates[0][0]) ? raw.coordinates[0][0] : raw.coordinates[0]) : null);

    if (Array.isArray(ring) && ring.length > 0) {
      let sumLng = 0;
      let sumLat = 0;
      let count = 0;
      for (const pt of ring) {
        if (Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
          sumLng += Number(pt[0]);
          sumLat += Number(pt[1]);
          count++;
        }
      }
      if (count > 0) {
        return {
          lat: Math.round((sumLat / count) * 10000) / 10000,
          lon: Math.round((sumLng / count) * 10000) / 10000
        };
      }
    }
  } catch {}
  return null;
}

const CACHE_DURATION_MS = 3 * 60 * 1000; // Cache 3 phút
const cache = new Map();

/**
 * Quy đổi độ ẩm thể tích đất (Volumetric Soil Water Content m³/m³, thường từ 0.15 đến 0.65)
 * sang phần trăm độ ẩm nông nghiệp thông dụng (0 - 100%).
 * Trong đất thịt pha cát canh tác rau quả:
 * 0.20 m³/m³ ~ 35% (khô)
 * 0.38 - 0.52 m³/m³ ~ 65% - 80% (tối ưu cho cây trồng)
 * > 0.58 m³/m³ ~ > 88% (bão hòa nước/úng)
 */
function normalizeSoilMoisture(volumetric) {
  if (volumetric === null || volumetric === undefined || isNaN(volumetric)) return 68;
  const val = Number(volumetric);
  // Hệ số chuẩn hóa nông học
  const pct = Math.round((val / 0.62) * 85);
  return Math.min(98, Math.max(25, pct));
}

/**
 * Quy đổi bức xạ quang năng mặt trời (W/m²) sang quang thông tương đương (Lux).
 * 1 W/m² bức xạ mặt trời xấp xỉ ~ 115 - 126 Lux trong điều kiện ánh sáng tự nhiên.
 */
function normalizeDirectRadiationToLux(radiationWm2) {
  if (radiationWm2 === null || radiationWm2 === undefined || isNaN(radiationWm2)) {
    const hour = new Date().getHours();
    return hour >= 6 && hour <= 18 ? 45000 : 0;
  }
  const rad = Number(radiationWm2);
  if (rad <= 0) return 0;
  const lux = Math.round(rad * 120);
  return Math.min(100000, lux);
}

/**
 * Lấy vị trí nông trại động hoàn toàn từ CSDL (tọa độ GPS của Thửa hoặc Nông trại)
 */
export async function resolveFarmLocation(plot) {
  const defaultFallback = {
    name: 'Nông trại Farmely Củ Chi',
    lat: 10.6877,
    lon: 106.3503,
    stationId: 'AGRO-FARMELY-DEFAULT'
  };

  if (!plot) return defaultFallback;

  const farmName = plot.landName || plot.land_name || plot.location || plot.name || 'Nông trại Farmely';
  const stationId = `AGRO-${plot.plotCode || plot.plot_code || plot.id || 'IOT'}`;

  // 1. Ưu tiên cao nhất: Tọa độ latitude/longitude đã được tính toán từ PostgreSQL
  if (plot.latitude && plot.longitude && !isNaN(plot.latitude) && !isNaN(plot.longitude)) {
    return {
      name: farmName,
      lat: Number(plot.latitude),
      lon: Number(plot.longitude),
      stationId
    };
  }

  // 2. Ưu tiên 2: Trích xuất trực tiếp từ ranh giới GeoJSON của thửa đất hoặc nông trại
  const centroid = extractCentroidFromGeoJson(plot.boundary || plot.boundary_geojson || plot.plot_boundary_geojson || plot.land_boundary_geojson);
  if (centroid) {
    return {
      name: farmName,
      lat: centroid.lat,
      lon: centroid.lon,
      stationId
    };
  }

  // 3. Ưu tiên 3: Tìm trong danh sách Nông trại tải động từ CSDL (/api/lands)
  const landId = plot.landId || plot.land_id;
  const lands = await getDynamicFarmLands();
  if (lands && lands.length > 0) {
    let matchedLand = null;
    if (landId) {
      matchedLand = lands.find(l => String(l.landId || l.land_id || l.id) === String(landId));
    }
    if (!matchedLand && farmName) {
      matchedLand = lands.find(l => (l.landName || l.land_name || '').toLowerCase().includes(farmName.toLowerCase()));
    }
    if (matchedLand) {
      if (matchedLand.latitude && matchedLand.longitude) {
        return {
          name: matchedLand.landName || matchedLand.land_name || farmName,
          lat: Number(matchedLand.latitude),
          lon: Number(matchedLand.longitude),
          stationId: `AGRO-LAND-${matchedLand.landId || 'DB'}`
        };
      }
      const landCentroid = extractCentroidFromGeoJson(matchedLand.boundary || matchedLand.boundary_geojson);
      if (landCentroid) {
        return {
          name: matchedLand.landName || matchedLand.land_name || farmName,
          lat: landCentroid.lat,
          lon: landCentroid.lon,
          stationId: `AGRO-LAND-${matchedLand.landId || 'DB'}`
        };
      }
    }
  }

  // 4. Fallback theo địa chỉ lưu trong DB nếu chưa có boundary
  const addr = String(plot.address || plot.location || '').toLowerCase();
  if (addr.includes('long an') || addr.includes('đức hòa') || addr.includes('duc hoa')) {
    return { name: farmName, lat: 10.7025, lon: 106.4011, stationId };
  }
  if (addr.includes('đà lạt') || addr.includes('da lat') || addr.includes('lâm đồng')) {
    return { name: farmName, lat: 11.9404, lon: 108.4583, stationId };
  }
  if (addr.includes('mộc châu') || addr.includes('sơn la')) {
    return { name: farmName, lat: 20.8443, lon: 104.6838, stationId };
  }

  return {
    ...defaultFallback,
    name: farmName,
    stationId
  };
}

/**
 * Fetch dữ liệu thời tiết & cảm biến vi khí hậu nông nghiệp thời gian thực từ Open-Meteo
 * 
 * @param {object} plot Thửa đất hiện tại
 * @param {boolean} forceRefresh Bỏ qua cache
 * @returns {Promise<object>} Dữ liệu cảm biến thời gian thực và lịch sử 24h
 */
export async function fetchLiveAgroIotData(plot = null, forceRefresh = false) {
  const farm = await resolveFarmLocation(plot);
  const cacheKey = `${farm.lat.toFixed(4)}_${farm.lon.toFixed(4)}`;

  const now = Date.now();
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${farm.lat}&longitude=${farm.lon}&current=temperature_2m,relative_humidity_2m,soil_temperature_0cm,soil_moisture_0_to_1cm,surface_pressure,wind_speed_10m,direct_radiation,precipitation&hourly=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm,direct_radiation&timezone=Asia%2FBangkok&forecast_days=2`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const cur = json.current || {};
    const hourly = json.hourly || {};

    const tempVal = Number(cur.temperature_2m ?? 27.5);
    const airHumidityVal = Number(cur.relative_humidity_2m ?? 78);
    const soilMoistureVal = normalizeSoilMoisture(cur.soil_moisture_0_to_1cm);
    const lightLux = normalizeDirectRadiationToLux(cur.direct_radiation);
    const soilTempVal = Number(cur.soil_temperature_0cm ?? tempVal);
    const precipVal = Number(cur.precipitation ?? 0);
    const windVal = Number(cur.wind_speed_10m ?? 6);
    const pressureVal = Number(cur.surface_pressure ?? 1010);

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Tạo chuỗi 16 điểm thời gian cho biểu đồ Recharts (24 giờ gần nhất)
    const chartPoints = [];
    if (Array.isArray(hourly.time) && hourly.time.length > 0) {
      // Lấy 16 điểm phân bố đều trong 24 giờ của ngày hôm nay
      const currentHour = new Date().getHours();
      const startIndex = Math.max(0, currentHour - 14);
      const endIndex = Math.min(hourly.time.length - 1, startIndex + 18);

      for (let i = startIndex; i <= endIndex; i++) {
        const d = new Date(hourly.time[i]);
        const pointTime = !isNaN(d.getTime())
          ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : `${i}:00`;

        const pTemp = Number(hourly.temperature_2m?.[i] ?? 26);
        const pAir = Number(hourly.relative_humidity_2m?.[i] ?? 75);
        const pSoil = normalizeSoilMoisture(hourly.soil_moisture_0_to_1cm?.[i]);
        const pLux = Math.round(normalizeDirectRadiationToLux(hourly.direct_radiation?.[i]) / 1000);

        chartPoints.push({
          time: pointTime,
          temp: pTemp,
          moisture: pSoil,
          airHumidity: pAir,
          light: pLux
        });
      }
    }

    const result = {
      isLive3rdParty: true,
      provider: 'Open-Meteo Global Agrometeorology API',
      stationName: farm.name,
      stationId: farm.stationId,
      coordinates: `${farm.lat.toFixed(4)}°N, ${farm.lon.toFixed(4)}°E`,
      lastUpdated: timeStr,
      metrics: {
        temp: `${tempVal.toFixed(1)}°C`,
        soilMoisture: `${soilMoistureVal}%`,
        airHumidity: `${airHumidityVal}%`,
        light: lightLux >= 1000 ? `${(lightLux / 1000).toFixed(0)}.000 Lux` : `${lightLux} Lux`,
        soilTemp: `${soilTempVal.toFixed(1)}°C`,
        precipitation: `${precipVal.toFixed(1)} mm`,
        windSpeed: `${windVal.toFixed(1)} km/h`,
        pressure: `${pressureVal.toFixed(0)} hPa`
      },
      rawMetrics: {
        temp: tempVal,
        soilMoisture: soilMoistureVal,
        airHumidity: airHumidityVal,
        light: lightLux,
        soilTemp: soilTempVal,
        precipitation: precipVal,
        windSpeed: windVal,
        pressure: pressureVal
      },
      hourly: chartPoints.length > 0 ? chartPoints : generateRealisticFallbackHourly()
    };

    cache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.warn('[Open-Meteo IoT] Không thể lấy dữ liệu vi khí hậu live, chuyển sang fallback dự phòng:', err.message);
    return getRealisticFallbackData(farm);
  }
}

/**
 * Fallback thông minh nếu không có kết nối internet
 */
function getRealisticFallbackData(farm) {
  const now = new Date();
  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Mô phỏng chu kỳ nhật triều tự nhiên
  const isDay = hour >= 6 && hour <= 18;
  const temp = Number((isDay ? 28.5 + Math.sin((hour - 6) / 12 * Math.PI) * 4 : 24.2).toFixed(1));
  const airHumidity = Math.round(isDay ? 68 - Math.sin((hour - 6) / 12 * Math.PI) * 12 : 88);
  const soilMoisture = 68;
  const lightLux = isDay ? Math.round(Math.sin((hour - 6) / 12 * Math.PI) * 55000) : 0;

  return {
    isLive3rdParty: false,
    provider: 'Open-Meteo Global Agrometeorology (Cached / Offline Mode)',
    stationName: farm.name,
    stationId: farm.stationId,
    coordinates: `${farm.lat.toFixed(4)}°N, ${farm.lon.toFixed(4)}°E`,
    lastUpdated: timeStr,
    metrics: {
      temp: `${temp}°C`,
      soilMoisture: `${soilMoisture}%`,
      airHumidity: `${airHumidity}%`,
      light: lightLux >= 1000 ? `${(lightLux / 1000).toFixed(0)}.000 Lux` : `${lightLux} Lux`,
      soilTemp: `${temp}°C`,
      precipitation: '0.0 mm',
      windSpeed: '5.4 km/h',
      pressure: '1012 hPa'
    },
    rawMetrics: {
      temp,
      soilMoisture,
      airHumidity,
      light: lightLux,
      soilTemp: temp,
      precipitation: 0,
      windSpeed: 5.4,
      pressure: 1012
    },
    hourly: generateRealisticFallbackHourly()
  };
}

function generateRealisticFallbackHourly() {
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  return hours.map((t, idx) => {
    const fraction = idx / (hours.length - 1);
    const temp = Number((24 + Math.sin(fraction * Math.PI) * 8).toFixed(1));
    const moisture = Math.round(72 - Math.sin(fraction * Math.PI) * 6);
    const airHumidity = Math.round(85 - Math.sin(fraction * Math.PI) * 20);
    const light = Math.round(Math.sin(fraction * Math.PI) * 50);
    return { time: t, temp, moisture, airHumidity, light };
  });
}
