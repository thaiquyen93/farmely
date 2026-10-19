/**
 * Farmely - IoT Sensor Telemetry & Monitoring API Client
 * Cung cấp các hàm gọi REST API và kết nối SSE (Server-Sent Events) thời gian thực.
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';

/**
 * Lấy số liệu cảm biến mới nhất của 1 thửa đất (Plot)
 * @param {number|string} plotId 
 * @returns {Promise<{readingId, plotId, temperature, airHumidity, soilHumidity, recordedAt, status, statusMessage}>}
 */
export async function getLatestSensorReading(plotId) {
  const res = await fetch(`${BASE_URL}/api/sensors/plots/${plotId}/latest`);
  if (!res.ok) throw new Error(`Lỗi tải dữ liệu cảm biến plot ${plotId}: ${res.statusText}`);
  return await res.json();
}

/**
 * Lấy lịch sử dữ liệu cảm biến trong N giờ qua (được sắp xếp theo thứ tự thời gian tăng dần để vẽ biểu đồ)
 * @param {number|string} plotId 
 * @param {number} hours Mặc định 24 giờ
 * @returns {Promise<Array>}
 */
export async function getSensorHistory(plotId, hours = 24) {
  const res = await fetch(`${BASE_URL}/api/sensors/plots/${plotId}/history?hours=${hours}`);
  if (!res.ok) throw new Error(`Lỗi tải lịch sử cảm biến plot ${plotId}: ${res.statusText}`);
  return await res.json();
}

/**
 * Lấy tổng hợp chỉ số trung bình 24h & tình trạng của thửa đất
 * @param {number|string} plotId 
 * @returns {Promise<{plotId, latestReading, avgTemperature, avgAirHumidity, avgSoilHumidity, totalReadings24h}>}
 */
export async function getPlotSensorSummary(plotId) {
  const res = await fetch(`${BASE_URL}/api/sensors/plots/${plotId}/summary`);
  if (!res.ok) throw new Error(`Lỗi tải tổng hợp cảm biến plot ${plotId}: ${res.statusText}`);
  return await res.json();
}

/**
 * Kết nối luồng dữ liệu thời gian thực Server-Sent Events (SSE)
 * @param {number|string} plotId ID thửa đất cần theo dõi
 * @param {function(data): void} onUpdate Callback nhận số liệu mới nhất mỗi khi sensor sinh data
 * @param {function(error): void} onError Callback khi xảy ra lỗi kết nối
 * @returns {EventSource} Trả về đối tượng eventSource để gọi eventSource.close() khi rời trang
 */
export function subscribePlotSensorStream(plotId, onUpdate, onError) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return { close: () => {} };
  }
  const url = `${BASE_URL}/api/sensors/plots/${plotId}/stream`;
  const eventSource = new EventSource(url);

  const handleData = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onUpdate && data && typeof data === 'object') {
        onUpdate(data);
      }
    } catch (err) {
      console.error('[SSE] Lỗi parse dữ liệu sensor:', err);
    }
  };

  // Nhận bản ghi cập nhật cảm biến mới (cả sự kiện có tên SENSOR_UPDATE lẫn tin nhắn ngầm định)
  eventSource.addEventListener('SENSOR_UPDATE', handleData);
  eventSource.onmessage = handleData;

  // Sự kiện thông báo kết nối thành công
  eventSource.addEventListener('CONNECTED', (event) => {
    console.log('[SSE] Đã kết nối thành công tới trạm sensor plot:', plotId);
  });

  eventSource.onerror = (err) => {
    console.warn('[SSE] Mất kết nối hoặc lỗi đường truyền stream:', err);
    if (onError) onError(err);
  };

  return eventSource;
}

/**
 * Kích hoạt sinh ngay 1 điểm dữ liệu ngẫu nhiên (dùng khi Demo hoặc kiểm thử)
 * @param {number|string} plotId 
 */
export async function triggerManualMock(plotId = 1) {
  const res = await fetch(`${BASE_URL}/api/sensors/mock/generate?plotId=${plotId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Lỗi kích hoạt mock sensor: ${res.statusText}`);
  return await res.json();
}
