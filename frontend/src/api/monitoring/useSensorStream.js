import { useState, useEffect } from 'react';
import { getSensorHistory, getLatestSensorReading, subscribePlotSensorStream } from './sensorApi';

/**
 * Custom React Hook giúp Component tự động nhận dữ liệu cảm biến Real-time qua SSE
 * và tự ngắt kết nối khi chuyển trang.
 * 
 * @param {number|string} plotId ID thửa đất cần theo dõi
 * @param {number} historyHours Số giờ lịch sử tải ban đầu (mặc định 24h)
 * @returns {{
 *   latest: object|null,
 *   history: Array,
 *   isConnected: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   refetchHistory: Function
 * }}
 */
export function useSensorStream(plotId, historyHours = 24) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInitialData = async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      setError(null);

      const [histData, latestData] = await Promise.all([
        getSensorHistory(plotId, historyHours).catch(() => []),
        getLatestSensorReading(plotId).catch(() => null)
      ]);

      setHistory(histData || []);
      setLatest(latestData || (histData?.length ? histData[histData.length - 1] : null));
    } catch (err) {
      setError(err.message || 'Lỗi nạp dữ liệu cảm biến ban đầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!plotId) return;

    fetchInitialData();

    // Kết nối luồng Server-Sent Events (SSE)
    const eventSource = subscribePlotSensorStream(
      plotId,
      (newReading) => {
        setIsConnected(true);
        setLatest(newReading);

        // Đẩy điểm đo mới vào mảng lịch sử (giữ tối đa 40 điểm để biểu đồ trượt mượt mà)
        setHistory((prev) => {
          const updated = [...prev, newReading];
          return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
        });
      },
      () => {
        setIsConnected(false);
      }
    );

    // Tự động đóng kết nối khi rời khỏi trang
    return () => {
      eventSource.close();
    };
  }, [plotId, historyHours]);

  return {
    latest,
    history,
    isConnected,
    loading,
    error,
    refetchHistory: fetchInitialData
  };
}
