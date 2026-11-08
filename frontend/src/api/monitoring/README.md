# 📡 Hướng Dẫn Tích Hợp IoT Sensor & Telemetry Cho Frontend

Tài liệu này hướng dẫn cách kết nối và hiển thị dữ liệu cảm biến thời gian thực (Microclimate Telemetry) từ **`monitoring-service`** (Port: `8088` hoặc qua API Gateway `8080`).

---

## 1. Danh Sách Endpoint REST & SSE Stream

| Phương thức | Endpoint | Chức năng | Trả về |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/sensors/plots/{plotId}/latest` | Lấy chỉ số mới nhất của 1 thửa đất | `SensorReadingResponse` |
| **GET** | `/api/sensors/plots/{plotId}/history?hours=24` | Lấy lịch sử đo theo thứ tự thời gian tăng dần | `Array<SensorReadingResponse>` |
| **GET** | `/api/sensors/plots/{plotId}/summary` | Thống kê trung bình 24h & trạng thái | `PlotSensorSummaryResponse` |
| **GET** | `/api/sensors/plots/{plotId}/stream` | **SSE Stream** - Luồng dữ liệu Real-time | `text/event-stream` |
| **POST** | `/api/sensors/mock/generate?plotId={plotId}` | Bấm nút sinh ngay 1 điểm dữ liệu (để test/demo) | `SensorReadingResponse` |
| **POST** | `/api/sensors/mock/seed?plotId={plotId}&hours=24`| Reset & nạp lại 24 điểm dữ liệu lịch sử | `{ success: true }` |

---

## 2. Cấu Trúc Dữ Liệu (`SensorReadingResponse`)

```json
{
  "readingId": 105,
  "plotId": 1,
  "temperature": 29.4,
  "airHumidity": 71.2,
  "soilHumidity": 63.8,
  "recordedAt": "2026-10-12T14:04:15.123Z",
  "status": "OPTIMAL",
  "statusMessage": "Điều kiện vi khí hậu lý tưởng"
}
```

### Các trạng thái `status` & Màu sắc gợi ý trên UI:
* `OPTIMAL`: Trạng thái tốt (Badge Xanh lá `#10B981`)
* `WARNING_LOW_SOIL_MOISTURE`: Độ ẩm đất thấp < 45% (Badge Cam/Đỏ `#EF4444`)
* `WARNING_HIGH_SOIL_MOISTURE`: Độ ẩm đất cao > 80% (Badge Xanh dương `#3B82F6`)
* `WARNING_HIGH_TEMP`: Nhiệt độ cao > 35°C (Badge Cam `#F59E0B`)

---

## 3. Cách Sử Dụng Trong React (Đã Cung Cấp Sẵn Hook & API Client)

Các file tiện ích đã được tạo sẵn trong thư mục này:
* `sensorApi.js`: Các hàm gọi API thuần
* `useSensorStream.js`: React Hook tự động nhận dữ liệu realtime và tự dọn dẹp kết nối

### 👉 Cách Dùng Nhanh Với `useSensorStream` (Khuyên dùng):

```jsx
import React from 'react';
import { useSensorStream } from '@/api/monitoring/useSensorStream';

export function PlotTelemetryWidget({ plotId }) {
  // Hook tự động tải lịch sử ban đầu và lắng nghe SSE cập nhật liên tục!
  const { latest, history, isConnected, loading } = useSensorStream(plotId, 24);

  if (loading) return <div>Đang kết nối trạm cảm biến...</div>;

  return (
    <div className="telemetry-card">
      <div className="header">
        <h3>Trạm Cảm Biến - Thửa đất #{plotId}</h3>
        <span className={isConnected ? "badge-green" : "badge-gray"}>
          {isConnected ? "🟢 Real-time Online" : "⚪ Offline"}
        </span>
      </div>

      {/* Hiển thị 3 chỉ số đo mới nhất */}
      <div className="metrics-grid">
        <div className="metric-box">
          <span>Nhiệt độ</span>
          <strong>{latest?.temperature ?? '--'} °C</strong>
        </div>
        <div className="metric-box">
          <span>Độ ẩm không khí</span>
          <strong>{latest?.airHumidity ?? '--'} %</strong>
        </div>
        <div className="metric-box">
          <span>Độ ẩm đất</span>
          <strong>{latest?.soilHumidity ?? '--'} %</strong>
        </div>
      </div>

      {/* Thông điệp cảnh báo nếu có */}
      <p className="status-note">{latest?.statusMessage}</p>

      {/* Dùng mảng `history` này đưa trực tiếp vào Chart.js, Recharts hoặc ApexCharts */}
      {/* Ví dụ nhãn thời gian: history.map(item => new Date(item.recordedAt).toLocaleTimeString()) */}
    </div>
  );
}
```

---

## 4. Cách Tự Kết Nối Bằng JavaScript Thuần (Vanilla JS)

Nếu không dùng React hoặc muốn tự quản lý:

```javascript
import { subscribePlotSensorStream } from '@/api/monitoring/sensorApi';

const eventSource = subscribePlotSensorStream(
  1, // plotId
  (newReading) => {
    console.log("Nhận điểm đo mới từ cảm biến:", newReading);
    // Cập nhật DOM hoặc đẩy vào mảng chart
  },
  (error) => {
    console.error("Lỗi stream:", error);
  }
);

// Khi rời trang / hủy widget:
eventSource.close();
```

---

## 5. Lưu Ý Về Môi Trường & Cổng
* Backend chạy tại: `http://localhost:8088` (trực tiếp `monitoring-service`) hoặc qua API Gateway `http://localhost:8080/api/sensors/...`.
* Nếu có biến môi trường `VITE_API_BASE_URL` trong file `.env` của frontend, client sẽ tự động nhận base URL này.
