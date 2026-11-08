# TỔNG HỢP TOÀN BỘ CƠ SỞ DỮ LIỆU & SAMPLE DATA DỰ ÁN FARMELY
> **Mục tiêu:** Cung cấp tài liệu thiết kế cơ sở dữ liệu và bộ **Sample Data toàn diện** để Backend nạp vào PostgreSQL, giúp Frontend thay thế 100% Mock Data bằng API thực tế.
> **Căn cứ tài liệu:** 
> - [`smart_agrirent_postgresql_v2.sql`](file:///d:/S5/Farmely/Context/smart_agrirent_postgresql_v2.sql)
> - [`QUY TRÌNH SERVICES.md`](file:///d:/S5/Farmely/Context/QUY%20TR%C3%8CNH%20SERVICES.md) & [`seed_services.sql`](file:///d:/S5/Farmely/Context/seed_services.sql)
> - [`RP392 (NEW).md`](file:///d:/S5/Farmely/Context/RP392%20%28NEW%29.md)
> - Tổng hợp và mở rộng từ Mock Data: `marketplaceGisData.js`, `plots.js`, `crops.js`, `varieties.js`, `chatStorage.js`, `iotStations.js`, `processTemplates.js`, `CustomerDashboard.jsx`, `ExpertDashboard.jsx`, `FieldWorkerDashboard.jsx`.

---

## MỤC LỤC
1. [Kiến trúc & Phân hệ Database (5 Phân hệ chính + Phần mở rộng GIS/IoT)](#1-kiến-trúc--phân-hệ-database)
2. [Bảng ánh xạ đối chiếu Mock Data Frontend -> Database Table](#2-bảng-ánh-xạ-đối-chiếu-mock-data-frontend---database-table)
3. [Chi tiết lược đồ (Schema) & Sample Data từng bảng](#3-chi-tiết-lược-đồ-schema--sample-data-từng-bảng)
   - [Phân hệ 1: Tài khoản & Phân quyền (RBAC)](#phân-hệ-1-tài-khoản--phân-quyền-rbac)
   - [Phân hệ 2: Nông trại, Thửa đất, Cảm biến & GIS](#phân-hệ-2-nông-trại-thửa-đất-cảm-biến--gis)
   - [Phân hệ 3: Sinh học, Cây trồng, Giống & Độ tương thích](#phân-hệ-3-sinh-học-cây-trồng-giống--độ-tương-thích)
   - [Phân hệ 4: Danh mục Dịch vụ & Quy trình Canh tác VietGAP](#phân-hệ-4-danh-mục-dịch-vụ--quy-trình-canh-tác-vietgap)
   - [Phân hệ 5: Hợp đồng, Thửa thuê, Dịch vụ phát sinh & Thanh toán VietQR](#phân-hệ-5-hợp-đồng-thửa-thuê-dịch-vụ-phát-sinh--thanh-toán-vietqr)
   - [Phân hệ 6: Quản lý Vận hành, Công việc Công nhân & Nhật ký Canh tác](#phân-hệ-6-quản-lý-vận-hành-công-việc-công-nhân--nhật-ký-canh-tác)
   - [Phân hệ 7: Thu hoạch, Báo cáo Sự cố & Nghiệm thu](#phân-hệ-7-thu-hoạch-báo-cáo-sự-cố--nghiệm-thu)
   - [Phân hệ 8: Giao tiếp, Chat Tư vấn Đa kênh & Thông báo](#phân-hệ-8-giao-tiếp-chat-tư-vấn-đa-kênh--thông-báo)
   - [Phân hệ 9: Thư viện Tri thức Nông nghiệp & AI RAG](#phân-hệ-9-thư-viện-tri-thức-nông-nghiệp--ai-rag)
4. [File Script SQL thực thi (DDL & DML Seeding hoàn chỉnh)](#4-file-script-sql-thực-thi)

---

## 1. KIẾN TRÚC & PHÂN HỆ DATABASE

Hệ thống tuân thủ mô hình 5 phân hệ chuẩn của `smart_agrirent_postgresql_v2.sql` kèm 2 điểm mở rộng kỹ thuật để đáp ứng hoàn hảo giao diện Frontend hiện tại:
1. **Mở rộng GIS & Thuộc tính Thửa đất:** Bổ sung tọa độ GeoJSON, loại đất (`soil_type`), hướng nắng, độ thoát nước để phục vụ bản đồ số tương tác trên sàn Marketplace.
2. **Trạm IoT Phần cứng:** Chuẩn hóa bảng `iot_stations` kết nối với `sensor_readings` để hiển thị Dashboard thời gian thực cho khách hàng.

```
                      +------------------------------------------+
                      |         SUBSYSTEM 1: IDENTITY            |
                      |          roles  <---  users              |
                      +------------------------------------------+
                                           |
       +-----------------------------------+-----------------------------------+
       |                                   |                                   |
+--------------------------+  +--------------------------+  +--------------------------+
|  SUBSYSTEM 2: MASTER DATA|  |  SUBSYSTEM 3: RENTALS    |  |  SUBSYSTEM 5: COMMS & OPS|
| lands, plots, iot_station|  | contracts, rentals,      |  | conversations, messages, |
| crops, varieties, compat |  | service_requests,        |  | notifications, tasks,    |
| services, templates, doc |  | payment_transactions     |  | diaries, issues, harvest |
+--------------------------+  +--------------------------+  +--------------------------+
```

---

## 2. BẢNG ÁNH XẠ ĐỐI CHIẾU MOCK DATA FRONTEND -> DATABASE TABLE

| STT | Màn hình Frontend | File Mock hiện tại | Database Table thay thế | Nguồn dữ liệu tham chiếu |
|:---:|:---|:---|:---|:---|
| **1** | Đăng nhập / Phân quyền | `authStore.js` (User demo) | `roles`, `users` | `smart_agrirent_postgresql_v2.sql` + Mock Accounts |
| **2** | Sàn Marketplace & Bản đồ số | `marketplaceGisData.js`, `lands.js`, `plots.js` | `lands`, `plots` | `RP392 (NEW).md` + GIS Demo Data |
| **3** | Danh mục Cây trồng & Giống | `crops.js`, `varieties.js` | `crops`, `varieties` | `smart_agrirent_postgresql_v2.sql` + Mock Crops |
| **4** | Ma trận Đất - Cây thích hợp | `compatibility.js`, Tab Expert | `plot_variety_compatibility` | `smart_agrirent_postgresql_v2.sql` + Screen 42 |
| **5** | Đặt lịch tham quan vườn | `SiteVisitBooking.jsx`, `SiteVisitForm.jsx` | `site_visits` | `smart_agrirent_postgresql_v2.sql` |
| **6** | Giám sát Cảm biến IoT | `iotStations.js`, `CustomerDashboard.jsx` (Chart) | `iot_stations`, `sensor_readings` | `RP392 (NEW).md` + Mock Telemetry |
| **7** | Bảng giá Dịch vụ & Gói chăm sóc | `serviceCatalog` trong `CustomerDashboard.jsx` | `services` (S01 -> S15) | `seed_services.sql` & `QUY TRÌNH SERVICES.md` |
| **8** | Quy trình VietGAP chuẩn | `processTemplates.js`, Tab Expert | `process_templates`, `template_steps` | `Quy_Trinh_Canh_Tac...docx` + Screen 43 |
| **9** | Đặt thuê Thửa & Hợp đồng | `BookPlot.jsx`, `CustomerDashboard.jsx` | `contracts`, `rentals` | `RP392 (NEW).md` |
| **10**| Mua dịch vụ chăm sóc lẻ | `CustomerDashboard.jsx` (Modal mua) | `service_requests` | `QUY TRÌNH SERVICES.md` |
| **11**| Thanh toán QR & Lịch sử tiền | `VietQrModal.jsx`, `CardPaymentModal.jsx` | `payment_transactions` | `payment-service` API + DDL Ledger |
| **12**| Nhiệm vụ Công nhân hiện trường | `FieldWorkerDashboard.jsx` (Tab Tasks) | `care_tasks` | `RP392 (NEW).md` + UC11 / Screen 52 |
| **13**| Nhật ký canh tác khách xem | `CustomerDashboard.jsx` (Tab Nhật ký) | `farm_diaries` | `smart_agrirent_postgresql_v2.sql` |
| **14**| Cân đo sản lượng thu hoạch | `FieldWorkerDashboard.jsx` (Tab Harvest) | `harvest_results` | `smart_agrirent_postgresql_v2.sql` + UC15 |
| **15**| Báo cáo sâu bệnh / Sự cố | `FieldWorkerDashboard.jsx` & `ExpertDashboard.jsx` | `issue_reports` | `smart_agrirent_postgresql_v2.sql` + UC12 |
| **16**| Chat Realtime & Tư vấn | `chatStorage.js` (`localStorage`) | `conversations`, `messages` | `communication-service` + Demo Threads |
| **17**| Chuông Thông báo | Toast / Header Notifications | `notifications` | `communication-service` |
| **18**| Thư viện Tri thức / AI RAG | `knowledgeDocuments.js`, Tab Expert | `knowledge_documents` | `RP392 (NEW).md` + Mock Documents |

---

## 3. CHI TIẾT LƯỢC ĐỒ (SCHEMA) & SAMPLE DATA TỪNG BẢNG

### PHÂN HỆ 1: TÀI KHOẢN & PHÂN QUYỀN (RBAC)

#### Bảng `roles`
* **Mô tả:** Định nghĩa 4 nhóm quyền chính trong hệ thống.
* **Schema:** `role_id SERIAL PRIMARY KEY, role_name VARCHAR(50) UNIQUE NOT NULL`.
* **Sample Data:**
```sql
INSERT INTO roles (role_id, role_name) VALUES
(1, 'CUSTOMER'),
(2, 'EXPERT'),
(3, 'FIELD_WORKER'),
(4, 'ADMIN')
ON CONFLICT (role_id) DO NOTHING;
```

#### Bảng `users`
* **Mô tả:** Danh sách người dùng hệ thống (tương thích các tài khoản demo đã cấu hình trong `chatStorage.js` và `authStore.js`).
* **Schema:**
  - `user_id SERIAL PRIMARY KEY`
  - `role_id INT REFERENCES roles(role_id)`
  - `email VARCHAR(150) UNIQUE NOT NULL`
  - `password_hash VARCHAR(255) NOT NULL` (Mặc định: `$2a$10$...` tương đương `Password@123`)
  - `full_name VARCHAR(150) NOT NULL`
  - `phone_number VARCHAR(20)`
  - `address TEXT`
  - `avatar_url TEXT` *(Mở rộng phục vụ hiển thị avatar FE)*
  - `status user_status_enum DEFAULT 'ACTIVE'`
* **Sample Data:**
```sql
INSERT INTO users (user_id, role_id, email, password_hash, full_name, phone_number, address, status) VALUES
-- Khách hàng (Customers)
(1, 1, 'customer@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Lô Thái Quyền', '0901234567', 'Tòa nhà Landmark 81, P.22, Q.Bình Thạnh, TP.HCM', 'ACTIVE'),
(2, 1, 'duyanh@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Đào Duy Anh', '0912345678', 'Số 45 Lê Duẩn, P.Bến Nghé, Quận 1, TP.HCM', 'ACTIVE'),
(3, 1, 'tanguyen@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Tạ Nguyễn Khôi Nguyên', '0988776655', 'Biệt thự Thảo Điền, TP.Thủ Đức, TP.HCM', 'ACTIVE'),
(4, 1, 'vhoang@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Nguyễn Văn Hoàng', '0977123456', 'Khu Đô thị Phú Mỹ Hưng, Quận 7, TP.HCM', 'ACTIVE'),

-- Chuyên gia Nông nghiệp (Experts)
(5, 2, 'expert@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'ThS. Nguyễn Hoàng Nam', '0903888999', 'Viện Khoa học Nông nghiệp Miền Nam, TP.HCM', 'ACTIVE'),
(6, 2, 'thao.tran@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'ThS. Trần Phương Thảo', '0903777888', 'Trung tâm Công nghệ Sinh học Nông nghiệp Đà Lạt', 'ACTIVE'),
(7, 2, 'duc.le@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'TS. Lê Hoàng Đức', '0903666555', 'Đại học Nông Lâm TP.HCM', 'ACTIVE'),

-- Chuyên viên Lao động / Công nhân (Field Workers)
(8, 3, 'worker@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Trần Văn Lực', '0933111222', 'Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP.HCM', 'ACTIVE'),
(9, 3, 'dat.nguyen@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Nguyễn Văn Đạt', '0933222333', 'Xã Thái Mỹ, Huyện Củ Chi, TP.HCM', 'ACTIVE'),
(10, 3, 'hai.hoang@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Hoàng Thanh Hải', '0933444555', 'Thôn 4, Xã Tà Nung, TP.Đà Lạt, Lâm Đồng', 'ACTIVE'),

-- Quản trị viên (Admin)
(11, 4, 'admin@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Ban Quản Trị Farmely', '0909000111', 'Trụ sở Farmely Tech Hub, Quận 1, TP.HCM', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;
```

---

### PHÂN HỆ 2: NÔNG TRẠI, THỬA ĐẤT, CẢM BIẾN & GIS

#### Bảng `lands`
* **Mô tả:** Các khu trang trại sinh thái thuộc sở hữu và vận hành của Farmely.
* **Sample Data:**
```sql
INSERT INTO lands (land_id, land_name, address) VALUES
(1, 'Trang trại Happy Valley Củ Chi', 'Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh'),
(2, 'Trang trại Cao nguyên Mộc Châu', 'Tiểu khu Mía Đường, Thị trấn Nông trường Mộc Châu, Sơn La'),
(3, 'Trang trại Thung lũng Sinh thái Đà Lạt', 'Xã Tà Nung, TP. Đà Lạt, Tỉnh Lâm Đồng')
ON CONFLICT (land_id) DO NOTHING;
```

#### Bảng `plots`
* **Mô tả:** Đơn vị thửa đất cho thuê cốt lõi, có diện tích, đơn giá, trạng thái (`AVAIL`, `RENT`, `MAINT`), và tọa độ hiển thị lên GIS Map.
* **Sample Data:**
```sql
INSERT INTO plots (plot_id, land_id, plot_code, area, image_url, price_per_period, status, is_published) VALUES
(1, 1, 'P-01', 50.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1200000.00, 'RENT', TRUE),
(2, 1, 'P-02', 45.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1050000.00, 'RENT', TRUE),
(3, 1, 'P-03', 60.00, 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80', 1400000.00, 'RENT', TRUE),
(4, 1, 'P-04', 55.00, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80', 1300000.00, 'AVAIL', TRUE),
(5, 1, 'P-05', 70.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1600000.00, 'AVAIL', TRUE),
(6, 1, 'P-06', 40.00, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80', 950000.00, 'MAINT', FALSE)
ON CONFLICT (plot_id) DO NOTHING;
```

#### Bảng `iot_stations` *(Bổ sung chuẩn hóa từ Mock Frontend)*
* **Mô tả:** Danh mục thiết bị trạm quan trắc IoT gắn tại các luống đất.
* **Schema:** `station_id SERIAL PRIMARY KEY, station_code VARCHAR(50) UNIQUE, plot_id INT REFERENCES plots(plot_id), model VARCHAR(100), battery_level INT, status VARCHAR(20)`.
* **Sample Data:**
```sql
CREATE TABLE IF NOT EXISTS iot_stations (
    station_id    SERIAL PRIMARY KEY,
    station_code  VARCHAR(50) UNIQUE NOT NULL,
    plot_id       INT REFERENCES plots(plot_id),
    model         VARCHAR(100) NOT NULL,
    battery_level INT DEFAULT 100,
    status        VARCHAR(20) DEFAULT 'ONLINE'
);

INSERT INTO iot_stations (station_id, station_code, plot_id, model, battery_level, status) VALUES
(1, 'IOT-ST-01', 1, 'SmartAgri Station v2.4 (LoRaWAN + Solar)', 98, 'ONLINE'),
(2, 'IOT-ST-02', 2, 'SmartAgri Station v2.4 (LoRaWAN + Solar)', 92, 'ONLINE'),
(3, 'IOT-ST-03', 3, 'SmartAgri Station v2.1 (WiFi Mesh)', 85, 'ONLINE'),
(4, 'IOT-ST-04', 4, 'SmartAgri Station v2.4 (LoRaWAN + Solar)', 100, 'ONLINE')
ON CONFLICT (station_id) DO NOTHING;
```

#### Bảng `sensor_readings`
* **Mô tả:** Dữ liệu chuỗi thời gian (time-series) các thông số vi khí hậu thửa đất (chu kỳ đo 3 giờ/lần). Dùng vẽ biểu đồ Recharts trên `CustomerDashboard.jsx`.
* **Sample Data:**
```sql
INSERT INTO sensor_readings (reading_id, plot_id, temperature, air_humidity, soil_humidity, recorded_at) VALUES
(1, 1, 24.5, 82.0, 68.0, NOW() - INTERVAL '15 hours'),
(2, 1, 27.2, 75.0, 65.5, NOW() - INTERVAL '12 hours'),
(3, 1, 31.8, 62.0, 61.0, NOW() - INTERVAL '9 hours'),
(4, 1, 33.5, 55.0, 58.2, NOW() - INTERVAL '6 hours'),
(5, 1, 30.0, 68.0, 63.4, NOW() - INTERVAL '3 hours'),
(6, 1, 26.8, 76.5, 66.8, NOW()),
-- Thửa P-02 (Rau xà lách)
(7, 2, 23.8, 85.0, 72.0, NOW() - INTERVAL '6 hours'),
(8, 2, 26.5, 78.0, 70.2, NOW() - INTERVAL '3 hours'),
(9, 2, 25.0, 80.0, 71.5, NOW())
ON CONFLICT (reading_id) DO NOTHING;
```

#### Bảng `site_visits`
* **Mô tả:** Lịch hẹn xem và trải nghiệm thực địa trước khi ký hợp đồng thuê đất.
* **Sample Data:**
```sql
INSERT INTO site_visits (visit_id, plot_id, visitor_name, visitor_phone, visit_date, visit_slot, status, created_at) VALUES
(1, 4, 'Lê Văn Tùng', '0911223344', CURRENT_DATE + INTERVAL '2 days', 'MORNING', 'CONFIRMED', NOW() - INTERVAL '1 day'),
(2, 5, 'Trần Bích Thủy', '0922334455', CURRENT_DATE + INTERVAL '3 days', 'AFTERNOON', 'PENDING', NOW() - INTERVAL '4 hours')
ON CONFLICT (visit_id) DO NOTHING;
```

---

### PHÂN HỆ 3: SINH HỌC, CÂY TRỒNG, GIỐNG & ĐỘ TƯƠNG THÍCH (10 LOÀI RAU VIETGAP CHUẨN)
> **Nguồn chuẩn hóa:** Trích xuất nguyên bản từ tài liệu [`Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx`](file:///d:/S5/Farmely/Context/Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx) (Mục 2: Bảng thông số vận hành 10 loại cây trồng tại nông trại và Mục 3: Quy trình canh tác chi tiết).

#### Bảng `crops`
* **Mô tả:** Danh mục 10 loài cây trồng an toàn chủ lực tại trang trại Farmely theo tiêu chuẩn VietGAP (TCVN 11892-1:2017).
* **Sample Data:**
```sql
INSERT INTO crops (crop_id, crop_name) VALUES
(1, 'Rau muống cạn'),
(2, 'Cải ngọt / Cải bẹ'),
(3, 'Xà lách xoăn'),
(4, 'Cà chua bi (Cherry)'),
(5, 'Dưa leo baby'),
(6, 'Đậu cô ve'),
(7, 'Mướp hương'),
(8, 'Rau mồng tơi'),
(9, 'Ớt cay / Ớt chỉ thiên'),
(10, 'Rau dền (đỏ/cơm)')
ON CONFLICT (crop_id) DO NOTHING;
```

#### Bảng `varieties`
* **Mô tả:** 10 giống cây chọn lọc F1 tương ứng với chu kỳ sinh trưởng chuẩn (`expected_duration`) và thời gian nghỉ đất/cải tạo bắt buộc (`buffer_time` từ 3 - 7 ngày).
* **Sample Data:**
```sql
INSERT INTO varieties (variety_id, crop_id, variety_name, expected_duration, buffer_time) VALUES
(1, 1, 'Rau muống lá tre F1', 30, 4),      -- Chu kỳ 25-30 ngày, nghỉ đất 4 ngày, nhiệt độ 25-35°C, ẩm 70-85%
(2, 2, 'Cải ngọt bông F1', 35, 4),        -- Chu kỳ 30-35 ngày, nghỉ đất 4 ngày, nhiệt độ 22-32°C, ẩm 65-75%
(3, 3, 'Xà lách Romaine VietGAP', 45, 4), -- Chu kỳ 40-45 ngày, nghỉ đất 4 ngày, nhiệt độ 18-28°C, ẩm 60-70%
(4, 4, 'Cà chua bi đỏ F1', 80, 7),        -- Chu kỳ 75-85 ngày, nghỉ đất 7 ngày, nhiệt độ 20-30°C, ẩm 65-75%
(5, 5, 'Dưa leo baby F1', 55, 5),         -- Chu kỳ 50-60 ngày, nghỉ đất 5 ngày, nhiệt độ 25-32°C, ẩm 70-80%
(6, 6, 'Đậu cô ve lùn / leo F1', 55, 5),  -- Chu kỳ 50-55 ngày, nghỉ đất 5 ngày, nhiệt độ 20-30°C, ẩm 65-75%
(7, 7, 'Mướp hương cao sản F1', 65, 7),   -- Chu kỳ 60-70 ngày, nghỉ đất 7 ngày, nhiệt độ 25-35°C, ẩm 70-80%
(8, 8, 'Mồng tơi lá to F1', 35, 4),       -- Chu kỳ 30-35 ngày, nghỉ đất 4 ngày, nhiệt độ 25-35°C, ẩm 70-85%
(9, 9, 'Ớt chỉ thiên F1', 85, 7),         -- Chu kỳ 75-90 ngày, nghỉ đất 7 ngày, nhiệt độ 22-32°C, ẩm 65-75%
(10, 10, 'Rau dền đỏ F1', 30, 4)          -- Chu kỳ 25-30 ngày, nghỉ đất 4 ngày, nhiệt độ 25-35°C, ẩm 65-80%
ON CONFLICT (variety_id) DO NOTHING;
```

#### Bảng `plot_variety_compatibility`
* **Mô tả:** Ma trận tương thích nông học giữa từng thửa đất (P-01 đến P-06) với 10 giống cây trên dựa trên đặc điểm nền đất, giàn leo, ánh sáng và hệ thống tưới (Screen 42).
* **Sample Data:**
```sql
INSERT INTO plot_variety_compatibility (plot_id, variety_id) VALUES
-- Thửa P-01 (Đất phù sa bồi lắng Củ Chi, pH 6.0-6.8, thoát nước tốt, thích hợp rau ăn lá & quả thân bụi)
(1, 1), -- Rau muống lá tre F1 (95%)
(1, 2), -- Cải ngọt bông F1 (96%)
(1, 3), -- Xà lách Romaine VietGAP (100% - Hoàn hảo)
(1, 4), -- Cà chua bi đỏ F1 (98% - Rất thích hợp)
(1, 8), -- Mồng tơi lá to F1 (94%)
(1, 10),-- Rau dền đỏ F1 (95%)

-- Thửa P-02 (Luống đất tơi xốp bón trùn quế, che lưới lan giảm nắng, chuyên rau ăn lá & họ đậu)
(2, 1), -- Rau muống lá tre F1
(2, 2), -- Cải ngọt bông F1
(2, 3), -- Xà lách Romaine VietGAP
(2, 6), -- Đậu cô ve lùn / leo F1
(2, 8), -- Mồng tơi lá to F1
(2, 10),-- Rau dền đỏ F1

-- Thửa P-03 (Nhà màng kiên cố có kết cấu giàn cọc & giăng lưới, chuyên biệt cho cây dây leo)
(3, 4), -- Cà chua bi đỏ F1 (Lên giàn chữ A)
(3, 5), -- Dưa leo baby F1 (Leo giàn lưới, nuôi ong thụ phấn)
(3, 6), -- Đậu cô ve lùn / leo F1
(3, 7), -- Mướp hương cao sản F1 (Leo giàn ngang/vòm)

-- Thửa P-04 (Đất thịt pha tơi xốp, đón nắng quang hợp 8h/ngày, thoát nước nhanh)
(4, 3), -- Xà lách Romaine VietGAP
(4, 4), -- Cà chua bi đỏ F1
(4, 6), -- Đậu cô ve lùn / leo F1
(4, 9), -- Ớt chỉ thiên F1 (Ưa đất thoát nước tốt, giàu khoáng)

-- Thửa P-05 (Thửa diện tích lớn 70m2, đa tầng sinh thái kết hợp giàn và luống mặt đất)
(5, 1), -- Rau muống lá tre F1
(5, 5), -- Dưa leo baby F1
(5, 7), -- Mướp hương cao sản F1
(5, 8), -- Mồng tơi lá to F1
(5, 9), -- Ớt chỉ thiên F1

-- Thửa P-06 (Thửa đất sau thu hoạch đang bảo dưỡng, thích hợp gieo rau ăn lá ngắn ngày cải tạo đất)
(6, 1), -- Rau muống lá tre F1
(6, 2), -- Cải ngọt bông F1
(6, 8), -- Mồng tơi lá to F1
(6, 10) -- Rau dền đỏ F1
ON CONFLICT (plot_id, variety_id) DO NOTHING;
```

---

### PHÂN HỆ 4: DANH MỤC DỊCH VỤ & QUY TRÌNH CANH TÁC VIETGAP

#### Bảng `services`
* **Mô tả:** Toàn bộ 15 dịch vụ của Farmely (S01 -> S15) lấy trực tiếp từ `seed_services.sql` và `QUY TRÌNH SERVICES.md`.
* **Sample Data:**
```sql
INSERT INTO services (service_id, service_code, service_name, service_type, price, unit, description, status) VALUES
(1, 'S01', 'Tưới nước bổ sung', 'A_LA_CARTE', 25000.00, 'lần/luống', 'Tưới nước theo thông số kỹ thuật được giao hoặc đặt lẻ. Minh chứng: Độ ẩm trước/sau, ảnh chụp hiện trường.', 'ACTIVE'),
(2, 'S02', 'Làm cỏ luống & rãnh', 'A_LA_CARTE', 50000.00, 'luống/10m2', 'Làm sạch cỏ dại trong phạm vi được giao theo yêu cầu hoặc định kỳ. Minh chứng: Ảnh trước-sau.', 'ACTIVE'),
(3, 'S03', 'Xới đất, làm tơi bề mặt', 'A_LA_CARTE', 40000.00, 'luống', 'Xới và làm tơi lớp đất mặt giúp rễ hô hấp. Minh chứng: Ảnh đất tơi xốp.', 'ACTIVE'),
(4, 'S04', 'Bón phân theo giai đoạn', 'A_LA_CARTE', 60000.00, 'lần/luống', 'Bón loại phân hữu cơ và liều lượng đã được duyệt. Minh chứng: Ảnh bao bì và mặt luống.', 'ACTIVE'),
(5, 'S05', 'Phủ gốc / phủ luống', 'A_LA_CARTE', 70000.00, 'luống', 'Phủ rơm rạ, màng phủ giữ ẩm hạn chế cỏ. Minh chứng: Ảnh hiện trường phủ luống.', 'ACTIVE'),
(6, 'S06', 'Gieo hạt / trồng cây giống', 'A_LA_CARTE', 80000.00, 'luống', 'Gieo hạt hoặc trồng cây giống theo mật độ quy định đầu vụ. Minh chứng: Ảnh mật độ cấy.', 'ACTIVE'),
(7, 'S07', 'Trồng dặm bổ sung', 'A_LA_CARTE', 20000.00, 'lần/10 cây', 'Thay thế cây chết sau kiểm tra tỷ lệ sống. Minh chứng: Ảnh cây bén rễ.', 'ACTIVE'),
(8, 'S08', 'Tỉa cây / tỉa lá / định chồi', 'A_LA_CARTE', 45000.00, 'lần/luống', 'Tỉa chồi nách dưa leo, cành sát gốc cà chua. Minh chứng: Ảnh luống sau tỉa.', 'ACTIVE'),
(9, 'S09', 'Làm giàn / buộc đỡ cây', 'A_LA_CARTE', 120000.00, 'giàn/luống', 'Lắp cọc giàn chữ A hoặc giăng lưới chống gãy đổ. Minh chứng: Ảnh giàn hoàn thiện.', 'ACTIVE'),
(10, 'S10', 'Xử lý sâu bệnh đã duyệt', 'A_LA_CARTE', 90000.00, 'lần phun', 'Phun chế phẩm sinh học sau chẩn đoán/phê duyệt. Minh chứng: Ảnh phun & cách ly an toàn.', 'ACTIVE'),
(11, 'S11', 'Vệ sinh khu canh tác', 'A_LA_CARTE', 50000.00, 'lần/plot', 'Thu gom rác, tàn dư lá sau tỉa. Minh chứng: Ảnh khu vực sạch sẽ.', 'ACTIVE'),
(12, 'S12', 'Thu hoạch và cân sản lượng', 'A_LA_CARTE', 80000.00, 'lần/vụ', 'Thu hái đúng độ tuổi và cân đo sản lượng thực tế. Minh chứng: Ảnh cân sản phẩm.', 'ACTIVE'),
(13, 'S13', 'Phân loại / đóng gói', 'A_LA_CARTE', 35000.00, 'kg', 'Sơ chế, phân loại an toàn và đóng túi bảo quản. Minh chứng: Ảnh sản phẩm đóng gói.', 'ACTIVE'),
(14, 'S14', 'Gói ủy thác chăm sóc tạm thời (7 ngày)', 'FULL', 350000.00, 'gói/tuần', 'Chăm sóc ngắn hạn khi khách vắng nhà (tưới, tỉa, bắt sâu). Minh chứng: Ảnh task theo ngày.', 'ACTIVE'),
(15, 'S15', 'Gói chăm sóc toàn vụ (Assisted-Growing)', 'FULL', 1800000.00, 'vụ/luống', 'Trọn gói đi kèm hợp đồng Assisted-growing theo Process Template từ làm đất đến thu hoạch.', 'ACTIVE')
ON CONFLICT (service_id) DO NOTHING;
```

#### Bảng `process_templates` & `template_steps` (10 PHÁC ĐỒ VIETGAP CHUẨN CHO 10 LOÀI RAU)
* **Mô tả:** Phác đồ canh tác chuẩn mực VietGAP do Chuyên gia Nông nghiệp thiết lập cho **toàn bộ 10 giống rau** tại trang trại Farmely (Trích xuất từ [`Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx`](file:///d:/S5/Farmely/Context/Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx)), bao gồm chi tiết **88 bước công việc (Care Tasks)** từ khâu chuẩn bị đất, gieo cấy, bón phân, phòng trừ sâu bệnh sinh học đến cách ly và thu hoạch nghiệm thu (Screen 43 trong [`ExpertDashboard.jsx`](file:///d:/S5/Farmely/frontend/src/pages/expert/ExpertDashboard.jsx)).
* **Sample Data:**
```sql
-- ==============================================================================
-- 10 PROCESS TEMPLATES (CHUẨN HÓA THEO QUY TRÌNH 10 LOẠI RAU AN TOÀN VIETGAP)
-- ==============================================================================
INSERT INTO process_templates (template_id, variety_id, pt_created_by, version) VALUES
(1, 1, 5, 'v1.5 (Chuẩn VietGAP)'),
(2, 2, 5, 'v1.6 (Chuẩn VietGAP)'),
(3, 3, 5, 'v1.8 (Chuẩn VietGAP)'),
(4, 4, 5, 'v2.3 (Chuẩn VietGAP)'),
(5, 5, 5, 'v2.0 (Chuẩn VietGAP)'),
(6, 6, 5, 'v1.5 (Chuẩn VietGAP)'),
(7, 7, 5, 'v1.7 (Chuẩn VietGAP)'),
(8, 8, 5, 'v1.4 (Chuẩn VietGAP)'),
(9, 9, 5, 'v2.1 (Chuẩn VietGAP)'),
(10, 10, 5, 'v1.3 (Chuẩn VietGAP)')
ON CONFLICT (template_id) DO NOTHING;

-- ==============================================================================
-- TOÀN BỘ CÁC BƯỚC CHI TIẾT (TEMPLATE STEPS) CHO 10 LOÀI RAU
-- ==============================================================================
INSERT INTO template_steps (step_id, template_id, step_name, description, day_offset, duration_days, task_type, min_temp, max_temp, min_humidity, max_humidity) VALUES
(1, 1, 'Làm đất &amp; Bón lót', 'Xới đất tơi xốp sâu 15cm, đánh luống cao 20cm. Bón lót phân trùn quế 1.5kg/m2 + vôi bột khử chua + nấm đối kháng Trichoderma. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng &amp; bao bì phân lót', 0, 1, 'SOIL_PREP', 20.0, 35.0, 60.0, 85.0),
(2, 1, 'Gieo hạt &amp; Tưới đẫm', 'Ngâm hạt nước ấm (2 sôi 3 lạnh) 3 giờ, ủ nứt nanh. Gieo theo rạch cách nhau 15cm, hạt cách 3cm. Phủ lớp rơm rạ mục mỏng và tưới đẫm nước.. Minh chứng: Ảnh rạch gieo hạt &amp; luống sau tưới', 0, 1, 'PLANTING', 25.0, 35.0, 75.0, 90.0),
(3, 1, 'Tưới giữ ẩm &amp; Kiểm tra mầm', 'Tưới phun sương mịn ngày 2 lần (7h sáng và 16h chiều). Kiểm tra tỷ lệ nảy mầm, duy trì độ ẩm đất trên 70%.. Minh chứng: Ảnh mầm nhú xanh đều trên hàng', 3, 1, 'IRRIGATION', 22.0, 35.0, 70.0, 85.0),
(4, 1, 'Tỉa dặm &amp; Định mật độ', 'Cây đạt 2 lá mầm, nhổ bỏ cây còi cọc, tỉa khoảng cách cây trên hàng 4-5cm. Nhổ sạch cỏ dại phát sinh.. Minh chứng: Ảnh mật độ cây sau khi tỉa dặm', 7, 1, 'CARE', 22.0, 35.0, 70.0, 80.0),
(5, 1, 'Bón thúc đợt 1 (Đạm cá hữu cơ)', 'Hòa đạm cá ủ men vi sinh (hoặc bánh dầu hoai mục) tỷ lệ 1:200 tưới đều gốc. Xới nhẹ váng đất bề mặt giúp rễ hô hấp tốt.. Minh chứng: Ảnh thùng phân hòa loãng &amp; tưới luống', 10, 1, 'FERTILIZATION', 22.0, 35.0, 70.0, 80.0),
(6, 1, 'Kiểm tra sâu hại &amp; Phun BT', 'Kiểm tra mặt dưới lá tìm sâu tơ, sâu xanh. Phun phòng trừ bằng vi khuẩn Bacillus thuringiensis (BT - Delfin WG 15g/16L) vào chiều mát.. Minh chứng: Ảnh bình phun &amp; nhãn thuốc BT', 15, 1, 'PEST_CONTROL', 20.0, 32.0, 65.0, 80.0),
(7, 1, 'Bón thúc đợt 2 (Dịch chuối Humic)', 'Tưới bổ sung dịch chuối lên men giàu kali + Acid Humic giúp thân mập, bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh rễ cây mọc khỏe &amp; ngọn xanh bóng', 18, 1, 'FERTILIZATION', 22.0, 35.0, 70.0, 85.0),
(8, 1, 'Cách ly an toàn &amp; Chỉ tưới nước', 'Kiểm tra sâu bệnh lần cuối, tuyệt đối ngừng toàn bộ phân bón và thuốc BVTV. Chỉ duy trì tưới nước sạch đủ ẩm.. Minh chứng: Ảnh luống rau đồng đều trước thu hoạch', 23, 1, 'SAFETY_INTERVAL', 22.0, 35.0, 70.0, 80.0),
(9, 1, 'Thu hoạch &amp; Nghiệm thu sản lượng', 'Cắt ngọn sát gốc chừa lại 3cm nách lá để tái sinh (hoặc nhổ tỉa cả gốc). Cân điện tử, đóng sọt giao khách/lưu kho.. Minh chứng: Ảnh cân điện tử hiển thị số kg &amp; sọt rau', 26, 1, 'HARVEST', 20.0, 32.0, 60.0, 75.0),
(10, 2, 'Lên luống &amp; Bón lót', 'Lên luống cao 20cm rãnh rộng 30cm thoát nước. Bón lót phân trùn quế 1.2kg/m2 + vôi bột khử khuẩn + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống cao ráo và phân bón lót', 0, 1, 'SOIL_PREP', 20.0, 32.0, 60.0, 75.0),
(11, 2, 'Cấy cây con giống F1', 'Cấy cây con 10-12 ngày tuổi (3 lá thật) theo khoảng cách 15x15cm. Ấn nhẹ gốc, tưới đẫm nước bằng vòi sen mịn.. Minh chứng: Ảnh hàng cây sau cấy thẳng hàng', 1, 1, 'PLANTING', 22.0, 32.0, 70.0, 85.0),
(12, 2, 'Tưới hồi xanh &amp; Kích rễ', 'Tưới phân bón lá kích rễ hữu cơ sinh học (Roots 2 hoặc Acid Humic loãng). Bù cây héo chết nếu có.. Minh chứng: Ảnh đọt non nhú lá mới', 5, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(13, 2, 'Bón thúc đợt 1 &amp; Xới xáo', 'Tưới đạm hữu cơ vi sinh (phân đạm cá hoặc bánh dầu hoai). Xới nhẹ phá váng đất mặt, nhặt sạch cỏ dại.. Minh chứng: Ảnh gốc cải xanh và đất tơi xốp', 10, 1, 'FERTILIZATION', 20.0, 32.0, 65.0, 75.0),
(14, 2, 'Phòng trừ bọ nhảy sọc cong', 'Kiểm tra mật độ bọ nhảy. Phun thảo mộc Matrine (Wotac 5EC) hoặc nấm ký sinh Metarhizium (nấm xanh) lúc sáng sớm lúc bọ chưa bay.. Minh chứng: Ảnh thao tác phun kỹ mặt lá và đất', 15, 1, 'PEST_CONTROL', 20.0, 30.0, 60.0, 75.0),
(15, 2, 'Bón thúc đợt 2 &amp; Nuôi bẹ lá', 'Tưới bổ sung dịch đạm Amino Acid + dịch rong biển giúp bẹ cải nở tròn, giòn dẻo, ngọt vị.. Minh chứng: Ảnh bẹ lá cải nở to đều', 20, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(16, 2, 'Cách ly tuyệt đối &amp; Phòng thối nhũn', 'Ngừng toàn bộ phân bón. Nếu có vết đốm lá vi khuẩn phun nhẹ Kasugamycin (Kasumin 2SL), duy trì cách ly 5 ngày trước thu.. Minh chứng: Ảnh luống cải tươi tốt không sâu bệnh', 26, 1, 'SAFETY_INTERVAL', 20.0, 32.0, 60.0, 70.0),
(17, 2, 'Thu hoạch &amp; Nghiệm thu', 'Cắt sát gốc khi bẹ cải đẫy sức trước khi trổ hoa. Loại bỏ lá già sát đất, cân trọng lượng, chụp ảnh lưu kết quả thu hoạch.. Minh chứng: Ảnh cân ký sản lượng &amp; sọt cải thành phẩm', 32, 1, 'HARVEST', 20.0, 30.0, 60.0, 75.0),
(18, 3, 'Xử lý đất giá thể &amp; Lên luống', 'Đất phối trộn nhiều xơ dừa hoai, phân trùn quế, nấm Trichoderma. Lên luống cao 20cm đảm bảo thoát nước tối đa.. Minh chứng: Ảnh luống đất tơi mịn, xốp', 0, 1, 'SOIL_PREP', 18.0, 28.0, 60.0, 70.0),
(19, 3, 'Cấy cây giống từ vỉ ươm', 'Cấy cây con 12 ngày tuổi mật độ 20x20cm. Tưới phun sương nhẹ nhàng, che lưới đen giảm bức xạ nắng 2 ngày đầu.. Minh chứng: Ảnh luống cấy phủ lưới che mát', 1, 1, 'PLANTING', 18.0, 26.0, 65.0, 75.0),
(20, 3, 'Bén rễ &amp; Dỡ lưới che', 'Dỡ lưới che để cây đón nắng. Duy trì tưới phun sương 2 lần/ngày (8h sáng và 15h chiều). Nhặt lá chân úa.. Minh chứng: Ảnh cây đứng thẳng bén rễ xanh', 6, 1, 'CARE', 18.0, 28.0, 60.0, 70.0),
(21, 3, 'Bón thúc đợt 1 &amp; Bả ốc sên', 'Tưới dịch trùn quế loãng kích thích xòe tán. Rải bả mồi sinh học Ferric Phosphate (Snail Kill) quanh mép luống trừ ốc sên.. Minh chứng: Ảnh bả ốc rải quanh mép &amp; gốc rau', 12, 1, 'FERTILIZATION', 18.0, 28.0, 60.0, 70.0),
(22, 3, 'Kiểm tra rệp &amp; Phun dầu khoáng', 'Vạch kẽ lá kiểm tra rệp muội. Phun dầu khoáng sinh học SK Enspray 99EC nồng độ 0.3% phủ đều 2 mặt lá.. Minh chứng: Ảnh kiểm tra kẽ lá xà lách sạch sâu', 20, 1, 'PEST_CONTROL', 18.0, 26.0, 55.0, 70.0),
(23, 3, 'Bón thúc đợt 2 &amp; Phun Canxi-Bo', 'Phun Canxi-Bo hữu cơ ngừa hiện tượng cháy bìa lá (Tip-burn). Tưới gốc bổ sung dịch bánh dầu hoai mục.. Minh chứng: Ảnh tán xà lách xoăn cuộn dày', 28, 1, 'FERTILIZATION', 18.0, 28.0, 60.0, 70.0),
(24, 3, 'Cách ly phân thuốc &amp; Tưới gốc', 'Ngừng toàn bộ phân bón lá và thuốc. Chỉ tưới nước sạch trực tiếp vào gốc, tránh đọng nước trên bẹ lá sinh nấm.. Minh chứng: Ảnh bụi xà lách nở tròn đều', 36, 1, 'SAFETY_INTERVAL', 18.0, 26.0, 55.0, 65.0),
(25, 3, 'Thu hoạch &amp; Đóng gói', 'Dùng dao cắt ngang gốc sáng sớm khi sương vừa tan. Xếp khay xốp bọc màng thực phẩm, cân ký nghiệm thu.. Minh chứng: Ảnh cân điện tử &amp; cây xà lách tươi giòn', 42, 1, 'HARVEST', 16.0, 25.0, 50.0, 65.0),
(26, 4, 'Làm đất sâu &amp; Bón lót đáy', 'Đào hố sâu 25cm bón lót phân chuồng hoai 2kg/gốc + vôi bột khử chua + lân super + Trichoderma ngừa héo rũ gốc.. Minh chứng: Ảnh hố bón lót &amp; rãnh luống sâu', 0, 1, 'SOIL_PREP', 20.0, 30.0, 60.0, 75.0),
(27, 4, 'Cấy cây con &amp; Định vị', 'Cấy cây con 4 lá thật mật độ 50x70cm. Cắm que tre nhỏ định vị thân mềm tránh gió lay đổ ngã. Tưới đẫm nước.. Minh chứng: Ảnh hàng cây con cắm que định vị', 1, 1, 'PLANTING', 20.0, 28.0, 65.0, 75.0),
(28, 4, 'Bén rễ &amp; Tưới kích rễ đợt 1', 'Tưới phân kích rễ Humic + đạm cá loãng. Kiểm tra độ ẩm đất duy trì 65-75%.. Minh chứng: Ảnh rễ phát triển đọt non vươn cao', 10, 1, 'FERTILIZATION', 20.0, 30.0, 65.0, 75.0),
(29, 4, 'Cắm cọc giàn &amp; Buộc dây treo', 'Cắm cọc tre cao 1.8m hoặc buộc dây treo trần nhà lưới. Quấn thân cà chua theo dây. Vặt bỏ các lá già sát đất.. Minh chứng: Ảnh giàn cọc &amp; thân cây quấn dây', 18, 1, 'PRUNING', 20.0, 30.0, 60.0, 70.0),
(30, 4, 'Tỉa chồi nách &amp; Bón thúc thân', 'Vặt sạch toàn bộ chồi phụ ở nách lá, chỉ giữ 1 thân chính duy nhất. Bón thúc NPK hữu cơ 20-20-15 quanh tán cây.. Minh chứng: Ảnh nách lá sau khi vặt sạch chồi', 28, 1, 'PRUNING', 20.0, 30.0, 60.0, 75.0),
(31, 4, 'Bón đón hoa &amp; Phòng bọ trĩ', 'Phun vi lượng Bo chống rụng hoa. Phun phòng bọ trĩ bằng tinh dầu Neem phối hợp Abamectin sinh học.. Minh chứng: Ảnh chùm nụ hoa đầu tiên xuất hiện', 40, 1, 'FERTILIZATION', 20.0, 28.0, 60.0, 70.0),
(32, 4, 'Hỗ trợ thụ phấn &amp; Phun Canxi-Bo', 'Rung nhẹ dây giàn lúc 8:30 sáng giúp phấn hoa bung đều. Phun Canxi-Bo sữa sinh học ngăn thối đít quả.. Minh chứng: Ảnh chùm quả non xanh đậu đều', 48, 1, 'CARE', 20.0, 28.0, 60.0, 70.0),
(33, 4, 'Tỉa lá già &amp; Bón thúc quả lớn', 'Cắt tỉa lá già vàng bên dưới chùm quả thứ nhất. Bón thúc Kali hữu cơ (dịch chuối ủ vi sinh) giúp quả bóng mọng.. Minh chứng: Ảnh các chùm quả lớn đẫy sức', 58, 1, 'PRUNING', 20.0, 30.0, 65.0, 75.0),
(34, 4, 'Ngừng thuốc BVTV &amp; Thúc ngọt', 'Ngừng toàn bộ thuốc BVTV. Tưới thúc kali lần cuối giúp quả chuyển màu đỏ tươi và tăng độ ngọt (Brix).. Minh chứng: Ảnh quả bắt đầu chuyển màu vàng cam', 68, 1, 'SAFETY_INTERVAL', 20.0, 30.0, 60.0, 70.0),
(35, 4, 'Thu hoạch đợt 1 (Quả chín đỏ)', 'Dùng kéo cắt từng chùm hoặc quả đơn đạt độ chín 85%. Cân điện tử, chụp ảnh hiện trường lưu Harvest Result.. Minh chứng: Ảnh chùm quả chín đỏ rực &amp; cân ký', 75, 1, 'HARVEST', 20.0, 28.0, 55.0, 65.0),
(36, 4, 'Thu hoạch vét &amp; Thu dọn tàn dư', 'Thu toàn bộ quả còn lại, cắt dây hạ giàn, thu gom gốc rễ chuyển sang chế độ Maintenance nghỉ đất.. Minh chứng: Ảnh Plot dọn sạch tàn dư chuẩn bị ải', 82, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(37, 5, 'Làm đất xốp &amp; Bón lót rãnh', 'Đánh luống cao 25cm, rạch rãnh bón lót phân trùn quế 2kg/m2 + lân nung chảy + nấm đối kháng Trichoderma. Lấp đất màu.. Minh chứng: Ảnh luống cao rãnh rạch phân lót', 0, 1, 'SOIL_PREP', 22.0, 32.0, 65.0, 75.0),
(38, 5, 'Cấy cây con bầu ươm', 'Cấy cây con 8 ngày tuổi mật độ 40x50cm. Tưới đẫm nước xung quanh bầu rễ.. Minh chứng: Ảnh bầu cây con thẳng hàng trên luống', 1, 1, 'PLANTING', 22.0, 32.0, 70.0, 80.0),
(39, 5, 'Bén rễ &amp; Bón kích ngọn đọt', 'Cây bén rễ nhanh, tưới thúc đạm cá hữu cơ loãng kích thích phát triển rễ phụ và ngọn leo.. Minh chứng: Ảnh ngọn non vươn tua cuốn', 7, 1, 'FERTILIZATION', 22.0, 32.0, 70.0, 80.0),
(40, 5, 'Cắm giàn chữ A &amp; Căng lưới', 'Cắm cọc tre chữ A cao 2m, giăng lưới cước mắt 15cm. Cố định ngọn leo vào mắt lưới đầu tiên.. Minh chứng: Ảnh giàn lưới chữ A hoàn thiện', 14, 1, 'PRUNING', 22.0, 32.0, 65.0, 75.0),
(41, 5, 'Vặt nhánh gốc &amp; Bấm hoa sớm', 'Vặt sạch toàn bộ nhánh phụ và hoa từ nách lá 1 đến 5 để cây dồn sức nuôi thân leo lên đỉnh giàn.. Minh chứng: Ảnh thân chính sạch nhánh dưới gốc', 20, 1, 'PRUNING', 22.0, 32.0, 65.0, 75.0),
(42, 5, 'Bón thúc nuôi quả &amp; Phòng nấm', 'Bón thúc NPK 16-16-16 hữu cơ. Phun phòng nấm phấn trắng bằng Bacillus amyloliquefaciens (Serenade ASO).. Minh chứng: Ảnh hoa cái nở rộ trên các nách lá', 28, 1, 'FERTILIZATION', 22.0, 30.0, 65.0, 75.0),
(43, 5, 'Tưới đủ ẩm &amp; Bổ sung Kali', 'Dưa leo nuôi quả rất cần nước, tưới 2 lần/ngày không để khô hạn làm đắng trái. Bổ sung dịch chuối ủ men.. Minh chứng: Ảnh chùm quả non suôn thẳng', 35, 1, 'IRRIGATION', 22.0, 32.0, 70.0, 80.0),
(44, 5, 'Ngừng thuốc BVTV &amp; Cách ly', 'Ngừng hoàn toàn mọi loại thuốc BVTV, đảm bảo an toàn tuyệt đối khi thu hoạch.. Minh chứng: Ảnh quả dưa leo xanh mướt', 42, 1, 'SAFETY_INTERVAL', 22.0, 30.0, 65.0, 75.0),
(45, 5, 'Thu hoạch rộ lứa đầu', 'Thu hoạch quả dài 10-12cm khi vỏ còn lớp phấn trắng mịn. Cắt bằng kéo, thu cách ngày 1 lần.. Minh chứng: Ảnh sọt dưa leo baby &amp; cân ký', 46, 1, 'HARVEST', 20.0, 30.0, 60.0, 70.0),
(46, 5, 'Thu hoạch vét &amp; Vệ sinh giàn', 'Thu hết lứa quả cuối, cắt gốc dây dưa, tháo gỡ lưới thu gom tàn dư chuẩn bị phơi ải đất.. Minh chứng: Ảnh dọn sạch giàn lưới sau thu hoạch', 56, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(47, 6, 'Làm đất &amp; Bón lót luống', 'Lên luống cao 25cm thoát nước tốt. Bón lót phân chuồng hoai mục + lân super + vôi bột khử khuẩn. Rạch hàng.. Minh chứng: Ảnh luống cao ráo bón lót phân hoai', 0, 1, 'SOIL_PREP', 20.0, 30.0, 60.0, 70.0),
(48, 6, 'Gieo hạt hốc', 'Gieo 2 hạt/hốc cách nhau 30cm, sâu 2cm. Phủ tro trấu mỏng giữ ẩm, tưới nhẹ bằng ô doa.. Minh chứng: Ảnh hốc gieo hạt phủ tro trấu', 1, 1, 'PLANTING', 20.0, 30.0, 65.0, 75.0),
(49, 6, 'Tỉa định cây &amp; Xới nhẹ', 'Hạt mọc mầm đều, tỉa giữ lại 1 cây khỏe nhất/hốc. Dùng cào nhỏ xới nhẹ váng đất quanh gốc.. Minh chứng: Ảnh mầm đậu xanh khỏe 1 cây/hốc', 5, 1, 'CARE', 20.0, 30.0, 65.0, 75.0),
(50, 6, 'Bón thúc đợt 1 &amp; Vun nhẹ gốc', 'Tưới thúc đạm cá hữu cơ loãng. Vun một lớp đất mỏng vào cổ rễ giúp cây đứng vững.. Minh chứng: Ảnh gốc đậu được vun đất màu', 14, 1, 'FERTILIZATION', 20.0, 30.0, 65.0, 75.0),
(51, 6, 'Cắm giàn leo chữ A', 'Cắm giàn tre chữ A cao 1.8m, buộc nẹp ngang. Hướng dẫn ngọn đậu bám vào thân cọc.. Minh chứng: Ảnh giàn cọc tre thẳng tắp', 20, 1, 'PRUNING', 20.0, 30.0, 60.0, 70.0),
(52, 6, 'Bón thúc đón hoa &amp; Phun Bo', 'Bón NPK hữu cơ cân đối. Phun phân bón lá Bo sinh học chống rụng hoa tăng tỷ lệ đậu quả.. Minh chứng: Ảnh chùm hoa đậu trắng tím nở rộ', 30, 1, 'FERTILIZATION', 20.0, 28.0, 60.0, 70.0),
(53, 6, 'Phòng dòi đục thân &amp; Sâu quả', 'Phun chế phẩm vi khuẩn BT hoặc Emamectin benzoate (Tasieu 1.9EC) phòng sâu đục quả. Bắt đầu thời kỳ cách ly.. Minh chứng: Ảnh phun thuốc sinh học đều giàn', 38, 1, 'PEST_CONTROL', 20.0, 28.0, 60.0, 70.0),
(54, 6, 'Thu hoạch lứa đầu', 'Thu hoạch quả bánh tẻ màu xanh tươi, hạt chưa gồ to. Hái nhẹ tay tránh rách cành hoa.. Minh chứng: Ảnh rổ đậu cô ve tươi giòn', 45, 1, 'HARVEST', 20.0, 28.0, 55.0, 65.0),
(55, 6, 'Thu hoạch lứa 2 &amp; Dọn tàn dư', 'Thu hết các quả còn lại, cắt bỏ dây đậu gom vào khu ủ rác hữu cơ.. Minh chứng: Ảnh cân ký sản lượng cuối vụ', 52, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(56, 7, 'Đào hố &amp; Bón lót đáy', 'Đào hố 40x40cm, sâu 30cm. Bón lót 3kg phân chuồng ủ hoai + 100g lân + vôi khử trùng + nấm Trichoderma. Lấp đất ủ 2 ngày.. Minh chứng: Ảnh hố phân lót đáy tơi xốp', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(57, 7, 'Cấy cây con bầu ươm', 'Ngâm ủ hạt gieo bầu 7 ngày trước. Cấy cây con 2 lá thật vào hố, khoảng cách hốc 1m. Tưới đẫm nước.. Minh chứng: Ảnh cây con mướp trong hố đất', 1, 1, 'PLANTING', 25.0, 35.0, 70.0, 85.0),
(58, 7, 'Bén rễ &amp; Bón thúc kích ngọn', 'Cây bén rễ nhú tua cuốn, tưới dịch trùn quế loãng kích thích thân dây vươn dài khỏe.. Minh chứng: Ảnh ngọn mướp mập mạp xanh tốt', 10, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 80.0),
(59, 7, 'Bắt giàn mái bằng / Giàn lưới', 'Làm giàn mái bằng hoặc giàn lưới cao 2m. Cắm cọc dắt ngọn mướp bò lên mặt giàn.. Minh chứng: Ảnh ngọn mướp leo chạm mặt giàn', 18, 1, 'PRUNING', 25.0, 35.0, 65.0, 75.0),
(60, 7, 'Bấm ngọn chính kích nhánh cái', 'Khi ngọn chính bò lên giàn được 1m, bấm ngọn sinh trưởng để kích thích bung nhiều nhánh cấp 1 mang hoa cái.. Minh chứng: Ảnh vết bấm ngọn &amp; các chồi nhánh', 28, 1, 'PRUNING', 25.0, 35.0, 65.0, 75.0),
(61, 7, 'Treo bẫy ruồi vàng &amp; Bón hoa', 'Treo bẫy dẫn dụ Pheromone (Vizubon-D) ngoài rìa giàn trừ ruồi đục quả. Bón NPK hữu cơ nuôi hoa.. Minh chứng: Ảnh bẫy ruồi vàng treo đầu giàn', 38, 1, 'PEST_CONTROL', 25.0, 32.0, 65.0, 75.0),
(62, 7, 'Nuôi quả lớn &amp; Tưới đủ nước', 'Mướp nuôi quả cần rất nhiều nước, tưới giữ ẩm 70-80%. Bổ sung dịch chuối trứng giàu Kali.. Minh chứng: Ảnh quả mướp non treo lủng lẳng', 48, 1, 'IRRIGATION', 25.0, 35.0, 70.0, 80.0),
(63, 7, 'Cách ly tuyệt đối &amp; Tỉa lá già', 'Ngừng toàn bộ thuốc BVTV. Cắt bỏ bớt các lá già vàng phía dưới giúp giàn thông thoáng đón gió.. Minh chứng: Ảnh giàn mướp thông thoáng, sai quả', 56, 1, 'SAFETY_INTERVAL', 25.0, 35.0, 65.0, 75.0),
(64, 7, 'Thu hoạch đợt 1 (Quả thẳng thơm)', 'Cắt quả khi đạt độ dài 25-30cm, vỏ mềm thơm ngát. Cân ký và chụp ảnh nghiệm thu.. Minh chứng: Ảnh quả mướp hương trên cân điện tử', 60, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(65, 7, 'Thu hoạch đợt 2 &amp; Vệ sinh giàn', 'Thu các lứa quả còn lại, cắt gốc dọn dây tàn dư để chuẩn bị chu kỳ nghỉ đất.. Minh chứng: Ảnh dọn sạch giàn chuẩn bị cày ải', 68, 1, 'HARVEST', 25.0, 35.0, 60.0, 70.0),
(66, 8, 'Lên luống &amp; Bón lót hữu cơ', 'Đất nhiều mùn, tơi xốp. Lên luống cao 20cm, bón lót phân trùn quế 1.5kg/m2 + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống phẳng mịn, bón phân đều', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(67, 8, 'Gieo hạt theo hàng', 'Ngâm hạt nước ấm 4 giờ. Rạch hàng cách nhau 20cm, gieo hạt cách 10cm, phủ lớp đất mỏng 1cm. Tưới đẫm.. Minh chứng: Ảnh luống sau gieo được phủ ẩm', 1, 1, 'PLANTING', 25.0, 35.0, 75.0, 85.0),
(68, 8, 'Kiểm tra mầm &amp; Tỉa dặm', 'Hạt mọc mầm 2 lá, tỉa giữ khoảng cách 12-15cm. Tưới nước giữ ẩm ngày 2 lần.. Minh chứng: Ảnh cây con mồng tơi mập xanh', 6, 1, 'CARE', 25.0, 35.0, 70.0, 85.0),
(69, 8, 'Bón thúc đợt 1 (Đạm cá)', 'Tưới thúc đạm cá lên men hoặc bánh dầu ngâm ủ vi sinh loãng giúp bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh tưới phân hữu cơ quanh gốc', 12, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 85.0),
(70, 8, 'Bón thúc đợt 2 &amp; Xới xáo', 'Xới nhẹ rãnh luống, bón bổ sung phân trùn quế rải mặt + dịch chuối Humic. Nhặt sạch cỏ dại.. Minh chứng: Ảnh lá mồng tơi to tròn, xanh bóng', 18, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 85.0),
(71, 8, 'Kiểm tra sâu khoang &amp; Cách ly', 'Vạch lá bắt sâu khoang thủ công. Phun vi khuẩn BT nếu mật độ cao. Bắt đầu ngừng phân bón thuốc trừ sâu.. Minh chứng: Ảnh kiểm tra tán lá lành lặn', 24, 1, 'PEST_CONTROL', 22.0, 35.0, 65.0, 80.0),
(72, 8, 'Thu hoạch đọt &amp; Nghiệm thu', 'Cắt đọt non dài 15-20cm chừa lại 2 nách lá sát gốc để tiếp tục sinh nhánh lứa 2. Cân ký giao khách.. Minh chứng: Ảnh đọt mồng tơi trên cân &amp; sọt rau', 30, 1, 'HARVEST', 22.0, 32.0, 60.0, 75.0),
(73, 9, 'Lên luống cao &amp; Bón lót sâu', 'Lên luống cao 30cm rãnh sâu chống úng. Bón lót phân chuồng hoai 2kg/m2 + vôi bột khử nấm + lân + Trichoderma.. Minh chứng: Ảnh luống cao rãnh sâu thoát nước', 0, 1, 'SOIL_PREP', 22.0, 32.0, 60.0, 70.0),
(74, 9, 'Cấy cây con giống vỉ ươm', 'Cấy cây con 20 ngày tuổi (4-5 lá thật) theo khoảng cách 45x50cm. Tưới đẫm nước định vị gốc.. Minh chứng: Ảnh hàng ớt cấy ngay ngắn', 1, 1, 'PLANTING', 22.0, 32.0, 65.0, 75.0),
(75, 9, 'Bén rễ &amp; Tưới kích rễ đợt 1', 'Tưới phân kích rễ Humic + đạm cá loãng. Xới nhẹ đất mặt luống giúp rễ ăn sâu.. Minh chứng: Ảnh đọt non nhú lá xanh đậm', 12, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(76, 9, 'Tỉa cành chạc V &amp; Cắm cọc', 'Vặt sạch toàn bộ chồi nách và lá phía dưới chạc chữ V đầu tiên. Cắm cọc tre buộc thân chống đổ ngã.. Minh chứng: Ảnh thân ớt thông thoáng dưới chạc V', 25, 1, 'PRUNING', 22.0, 32.0, 60.0, 70.0),
(77, 9, 'Bón thúc đợt 2 &amp; Phun vi lượng', 'Bón NPK hữu cơ 20-20-15. Phun Bo vi lượng sinh học chống rụng hoa tăng tỷ lệ đậu trái.. Minh chứng: Ảnh hoa ớt trắng nở đều trên chạc', 40, 1, 'FERTILIZATION', 22.0, 30.0, 60.0, 70.0),
(78, 9, 'Phòng trừ bọ trĩ &amp; Thán thư', 'Phun tinh dầu Neem + Nano Bạc Đồng phòng bọ trĩ làm xoăn đọt và bệnh thán thư nổ trái.. Minh chứng: Ảnh chùm quả ớt non chỉ thiên', 55, 1, 'PEST_CONTROL', 22.0, 30.0, 60.0, 70.0),
(79, 9, 'Thúc chín quả &amp; Ngừng thuốc', 'Ngừng toàn bộ thuốc BVTV. Tưới kali hữu cơ (dịch chuối lên men) giúp quả chuyển màu đỏ tươi, tăng độ cay.. Minh chứng: Ảnh quả ớt chuyển màu đỏ rực', 70, 1, 'SAFETY_INTERVAL', 22.0, 32.0, 60.0, 70.0),
(80, 9, 'Thu hoạch quả đỏ đợt 1', 'Hái từng quả chín đỏ đều kèm cuống. Cân điện tử, chụp ảnh nghiệm thu sản lượng.. Minh chứng: Ảnh rổ ớt đỏ tươi trên cân điện tử', 80, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(81, 9, 'Thu hoạch đợt 2 &amp; Dưỡng cây', 'Thu hoạch đợt 2, bón bổ sung phân trùn quế gốc để duy trì cây ra hoa lứa tiếp theo.. Minh chứng: Ảnh gốc ớt sau khi bón dưỡng lứa 2', 88, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(82, 10, 'Làm đất mịn &amp; Bón lót', 'Đất cày xới kỹ, tán nhỏ tơi mịn. Bón lót phân trùn quế hoai 1.2kg/m2 + vôi bột khử khuẩn. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng mịn', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(83, 10, 'Gieo vãi hạt trộn cát', 'Hạt dền rất nhỏ, trộn đều với cát mịn hoặc tro bếp theo tỷ lệ 1:5 rồi rắc đều trên mặt luống. Phủ rơm mục mỏng, tưới đẫm.. Minh chứng: Ảnh luống sau gieo phủ rơm tưới ẩm', 1, 1, 'PLANTING', 25.0, 35.0, 75.0, 85.0),
(84, 10, 'Kiểm tra mầm &amp; Tưới sương', 'Hạt nảy mầm sau 2-3 ngày. Tưới phun sương nhẹ nhàng ngày 2 lần, tránh vòi xịt mạnh làm dập mầm.. Minh chứng: Ảnh thảm mầm đỏ tía nhú đều', 4, 1, 'IRRIGATION', 25.0, 35.0, 70.0, 80.0),
(85, 10, 'Tỉa thưa &amp; Bón thúc đợt 1', 'Tỉa thưa bớt chỗ quá dày giữ khoảng cách 5-7cm/cây. Tưới thúc đạm cá hữu cơ loãng giúp vươn ngọn.. Minh chứng: Ảnh hàng rau dền sau tỉa thoáng', 10, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 80.0),
(86, 10, 'Bón thúc đợt 2 &amp; Nhặt cỏ', 'Tưới bổ sung dịch trùn quế. Nhặt sạch cỏ dại cạnh tranh dinh dưỡng. Đảm bảo độ ẩm đất 65-80%.. Minh chứng: Ảnh lá rau dền đỏ tía mọc rộ', 16, 1, 'FERTILIZATION', 25.0, 35.0, 65.0, 80.0),
(87, 10, 'Kiểm tra sâu &amp; Cách ly tuyệt đối', 'Kiểm tra sâu xanh ăn lá (bắt tay hoặc phun BT nếu mật độ cao). Ngừng tuyệt đối phân bón thuốc BVTV.. Minh chứng: Ảnh thảm rau dền đỏ mơn mởn', 21, 1, 'SAFETY_INTERVAL', 22.0, 32.0, 60.0, 75.0),
(88, 10, 'Thu hoạch &amp; Nghiệm thu', 'Nhổ cả cây rửa sạch đất rễ (hoặc cắt ngang thân chừa 3cm để tái sinh). Cân ký và chụp ảnh minh chứng.. Minh chứng: Ảnh bó rau dền đỏ trên cân điện tử', 26, 1, 'HARVEST', 20.0, 30.0, 60.0, 70.0)
ON CONFLICT (step_id) DO NOTHING;
```

---

### PHÂN HỆ 5: HỢP ĐỒNG, THỬA THUÊ, DỊCH VỤ PHÁT SINH & THANH TOÁN VIETQR

#### Bảng `contracts` & `rentals`
* **Mô tả:** Hợp đồng thuê thửa (kèm quy tắc Reservation 15 phút, thanh toán 100% trọn gói theo `RP392 (NEW).md`).
* **Sample Data:**
```sql
-- Hợp đồng của khách Lô Thái Quyền, Đào Duy Anh, Tạ Nguyễn Khôi Nguyên
INSERT INTO contracts (contract_id, renter_id, contract_number, total_amount, status, created_at) VALUES
(1, 1, 'HD-2026-FARM-001', 3000000.00, 'ACTIVE', NOW() - INTERVAL '30 days'),
(2, 2, 'HD-2026-FARM-002', 2850000.00, 'ACTIVE', NOW() - INTERVAL '25 days'),
(3, 3, 'HD-2026-FARM-003', 1400000.00, 'ACTIVE', NOW() - INTERVAL '10 days')
ON CONFLICT (contract_id) DO NOTHING;

INSERT INTO rentals (rental_id, contract_id, service_id, plot_id, variety_id, start_date, end_date, total_price, status) VALUES
-- Rental 1: Lô Thái Quyền (ID 1) - P-01 - Cà chua bi đỏ F1 (variety_id = 4) - Gói toàn vụ S15
(1, 1, 15, 1, 4, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '50 days', 3000000.00, 'ACTIVE'),
-- Rental 2: Đào Duy Anh (ID 2) - P-02 - Xà lách Romaine VietGAP (variety_id = 3) - Gói toàn vụ S15
(2, 2, 15, 2, 3, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '20 days', 2850000.00, 'ACTIVE'),
-- Rental 3: Tạ Nguyễn Khôi Nguyên (ID 3) - P-03 - Dưa leo baby F1 (variety_id = 5) - Tự chăm sóc (Self-growing, service_id = NULL)
(3, 3, NULL, 3, 5, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '45 days', 1400000.00, 'ACTIVE')
ON CONFLICT (rental_id) DO NOTHING;
```

#### Bảng `service_requests`
* **Mô tả:** Yêu cầu dịch vụ phát sinh do khách thuê mua thêm trong quá trình canh tác (ví dụ: bón phân thêm, tỉa cành, xử lý sâu bệnh).
* **Sample Data:**
```sql
INSERT INTO service_requests (request_id, rental_id, service_id, scheduled_date, status, created_at) VALUES
(1, 1, 4, CURRENT_DATE - INTERVAL '5 days', 'DONE', NOW() - INTERVAL '6 days'),
(2, 3, 10, CURRENT_DATE + INTERVAL '1 day', 'ASSIGNED', NOW() - INTERVAL '1 day'),
(3, 1, 8, CURRENT_DATE + INTERVAL '2 days', 'PENDING', NOW())
ON CONFLICT (request_id) DO NOTHING;
```

#### Bảng `payment_transactions`
* **Mô tả:** Sổ cái tài chính ghi nhận các giao dịch thanh toán VietQR / Thẻ (kết nối trực tiếp với `payment-service`).
* **Sample Data:**
```sql
INSERT INTO payment_transactions (transaction_id, contract_id, service_request_id, type, amount, payment_method, gateway_ref, status, created_at) VALUES
(1, 1, NULL, 'PAYMENT', 3000000.00, 'VIETQR', 'VQR-MBB-20261001-09823', 'SUCCESS', NOW() - INTERVAL '30 days'),
(2, 2, NULL, 'PAYMENT', 2850000.00, 'VIETQR', 'VQR-ICB-20261005-11029', 'SUCCESS', NOW() - INTERVAL '25 days'),
(3, 3, NULL, 'PAYMENT', 1400000.00, 'VIETQR', 'VQR-VCB-20261010-88412', 'SUCCESS', NOW() - INTERVAL '10 days'),
(4, NULL, 1, 'PAYMENT', 60000.00, 'VIETQR', 'VQR-MBB-20261011-33019', 'SUCCESS', NOW() - INTERVAL '6 days')
ON CONFLICT (transaction_id) DO NOTHING;
```

---

### PHÂN HỆ 6: QUẢN LÝ VẬN HÀNH, CÔNG VIỆC CÔNG NHÂN & NHẬT KÝ CANH TÁC

#### Bảng `care_tasks`
* **Mô tả:** Công việc thực địa giao cho Công nhân nông trường (Trần Văn Lực, Nguyễn Văn Đạt...) có kèm ảnh minh chứng nghiệm thu (Screen 52 trong `FieldWorkerDashboard.jsx`).
* **Sample Data:**
```sql
INSERT INTO care_tasks (task_id, rental_id, step_id, service_request_id, task_assigned_to, due_date, status, evidence_image_url, notes) VALUES
(1, 1, 2, NULL, 8, CURRENT_DATE - INTERVAL '15 days', 'DONE', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80', 'Đã xuống giống 25 cây cà chua con khỏe mạnh, tưới đẫm vi sinh Trichoderma.'),
(2, 1, 3, NULL, 8, CURRENT_DATE - INTERVAL '5 days', 'DONE', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80', 'Đã lắp giàn cọc chữ A, buộc dây cố định thân chính, bấm tỉa chồi nách sát gốc.'),
(3, 1, 4, 1, 8, CURRENT_DATE, 'IN_PROG', NULL, 'Đang tiến hành pha dịch đạm cá vi sinh bón gốc đợt 2.'),
(4, 2, 8, NULL, 9, CURRENT_DATE - INTERVAL '18 days', 'DONE', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'Cấy cây xà lách con tỷ lệ sống 98%.'),
(5, 3, NULL, 2, 8, CURRENT_DATE + INTERVAL '1 day', 'PENDING', NULL, 'Phun dung dịch gừng ớt tỏi sinh học trị bọ trĩ theo chỉ đạo của ThS. Nam.')
ON CONFLICT (task_id) DO NOTHING;
```

#### Bảng `farm_diaries`
* **Mô tả:** Nhật ký canh tác dòng thời gian hiển thị trên `CustomerDashboard.jsx` để khách theo dõi diễn biến từng giai đoạn.
* **Sample Data:**
```sql
INSERT INTO farm_diaries (diary_id, rental_id, task_id, content, image_url, created_at) VALUES
(1, 1, 1, 'Hôm nay bác Lực đã hoàn thành cấy cây con giống F1 ra luống P-01. Cây bén rễ xanh tươi.', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80', NOW() - INTERVAL '15 days'),
(2, 1, 2, 'Cây cà chua bi phát triển vượt bậc, đã hoàn thành lên giàn chữ A và bấm tỉa lá chân thông thoáng.', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80', NOW() - INTERVAL '5 days')
ON CONFLICT (diary_id) DO NOTHING;
```

---

### PHÂN HỆ 7: THU HOẠCH, BÁO CÁO SỰ CỐ & NGHIỆM THU

#### Bảng `issue_reports`
* **Mô tả:** Sự cố sâu bệnh/hạ tầng do công nhân gửi lên để chuyên gia chẩn đoán (Screen 53 & Screen 48).
* **Sample Data:**
```sql
INSERT INTO issue_reports (issue_id, rental_id, reported_by, handled_by, issue_type, description, image_url, status, resolution_notes, resolved_at) VALUES
(1, 3, 8, 5, 'Phát hiện bọ trĩ mặt dưới lá non', 'Lá dưa leo baby tại luống P-03 có hiện tượng quăn mép và chấm bạc li ti.', 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80', 'RESOLVED', 'ThS. Nam kê đơn: Pha chế phẩm sinh học gừng ớt 1:200, phun sương đều 2 mặt lá sau 16:30.', NOW() - INTERVAL '2 hours'),
(2, 1, 9, 5, 'Đầu béc tưới số 3 bị nghẹt cặn', 'Độ ẩm giảm cục bộ góc luống phía đông.', NULL, 'RESOLVED', 'Đã súc rửa màng lọc và thay béc phun sương mới. Độ ẩm đã đạt chuẩn 68%.', NOW() - INTERVAL '1 day')
ON CONFLICT (issue_id) DO NOTHING;
```

#### Bảng `harvest_results`
* **Mô tả:** Kết quả cân đo sản lượng thực tế khi đến kỳ thu hái rau củ (Screen 54 trong `FieldWorkerDashboard.jsx`).
* **Sample Data:**
```sql
INSERT INTO harvest_results (harvest_id, rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type, customer_confirmed) VALUES
(1, 2, 9, CURRENT_DATE + INTERVAL '10 days', 22.50, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'DELIVERY', FALSE)
ON CONFLICT (harvest_id) DO NOTHING;
```

---

### PHÂN HỆ 8: GIAO TIẾP, CHAT TƯ VẤN ĐA KÊNH & THÔNG BÁO

#### Bảng `conversations` & `messages`
* **Mô tả:** Các luồng hội thoại tư vấn chuyên gia, báo cáo kỹ thuật và AI Chatbot (kết nối trực tiếp với `communication-service`).
* **Sample Data:**
```sql
-- Cuộc trò chuyện giữa Khách Lô Thái Quyền (ID 1) và Chuyên gia Nam (ID 5)
INSERT INTO conversations (conversation_id, participant_one, participant_two, rental_id, plot_id, type, status) VALUES
(1, 1, 5, 1, 1, 'CUST_EXP', 'OPEN'),
(2, 2, 6, 2, 2, 'CUST_EXP', 'OPEN'),
(3, 8, 5, 3, 3, 'STAFF_EXP', 'OPEN')
ON CONFLICT (conversation_id) DO NOTHING;

INSERT INTO messages (message_id, conversation_id, sender_id, content, created_at) VALUES
(1, 1, 1, 'Chào chuyên gia Nam, cà chua bi của tôi ở thửa P-01 độ ẩm 68% đã đạt chuẩn chưa ạ?', NOW() - INTERVAL '2 hours'),
(2, 1, 5, 'Chào anh Quyền! Độ ẩm 68% là hoàn hảo cho giai đoạn cây chuẩn bị bung hoa nhé. Anh duy trì chế độ tưới sương sáng sớm là đạt.', NOW() - INTERVAL '1 hour 45 minutes'),
(3, 1, 1, 'Cảm ơn Thạc sĩ rất nhiều!', NOW() - INTERVAL '1 hour 30 minutes'),
(4, 3, 8, 'Thưa ThS. Nam, thửa P-03 dưa leo baby có bọ trĩ, em đã báo cáo kèm ảnh trên hệ thống.', NOW() - INTERVAL '3 hours'),
(5, 3, 5, 'Anh đã duyệt đơn thuốc sinh học S10 rồi nhé Lực. Chiều mát 16:30 em phun thảo mộc tỉ lệ 1:200 giúp anh.', NOW() - INTERVAL '2 hours 30 minutes')
ON CONFLICT (message_id) DO NOTHING;
```

#### Bảng `notifications`
* **Mô tả:** Thông báo đẩy in-app cho người dùng khi có sự kiện thanh toán, task hoàn thành, hoặc có tin nhắn mới.
* **Sample Data:**
```sql
INSERT INTO notifications (notification_id, user_id, title, content, is_read, created_at) VALUES
(1, 1, 'Thanh toán thành công', 'Bạn đã thanh toán thành công 3.000.000đ cho Hợp đồng HD-2026-FARM-001 qua VietQR.', TRUE, NOW() - INTERVAL '30 days'),
(2, 1, 'Nhiệm vụ canh tác hoàn thành', 'Bác Lực đã hoàn tất công việc lên giàn chữ A và tỉa lá cho luống cà chua bi của bạn.', FALSE, NOW() - INTERVAL '5 days'),
(3, 5, 'Báo cáo sự cố mới', 'Công nhân Trần Văn Lực vừa báo cáo sự cố bọ trĩ tại thửa P-03 cần chẩn đoán.', FALSE, NOW() - INTERVAL '3 hours')
ON CONFLICT (notification_id) DO NOTHING;
```

---

### PHÂN HỆ 9: THƯ VIỆN TRI THỨC NÔNG NGHIỆP & AI RAG

#### Bảng `knowledge_documents`
* **Mô tả:** Thư viện tài liệu kỹ thuật canh tác VietGAP do chuyên gia biên soạn và các văn bản quy chuẩn, tiến bộ kỹ thuật (TBKT) chính thức từ Bộ Nông nghiệp & Phát triển Nông thôn, Cục Bảo vệ Thực vật và Trung tâm Khuyến nông Quốc gia. Các tài liệu này làm căn cứ khoa học pháp lý chứng minh 10 quy trình canh tác và được nạp vector vào `ai-service` để phục vụ trợ lý ảo AI RAG (Screen 45 trong `ExpertDashboard.jsx`).
* **Danh sách tài liệu PDF thực tế tại thư mục [`d:\S5\Farmely\docs`](file:///d:/S5/Farmely/docs):**

| ID | Mã hiệu / Văn bản | Tên tài liệu khoa học | Cơ quan ban hành / Tác giả | File PDF thực tế | Ứng dụng & Căn cứ chứng minh |
|---|---|---|---|---|---|
| **1** | **Cẩm nang Quốc gia** | Sách Hướng Dẫn Đào Tạo Sản Xuất Rau An Toàn Theo VietGAP (200 trang) | Bộ Nông nghiệp & PTNT - Trung tâm Khuyến nông Quốc gia (TS. Đào Xuân Cường, TS. Trần Văn Khởi...) | [rau_an_toan_vietgap_huyen.pdf](file:///d:/S5/Farmely/docs/rau_an_toan_vietgap_huyen.pdf) | Căn cứ nền tảng cho toàn bộ 10 quy trình canh tác, tiêu chuẩn đất, nước, phân bón hữu cơ, quản lý dư lượng nitrat và ghi chép nhật ký nông trại. |
| **2** | **TBKT 01-104: 2021/BVTV** | Quy Trình Sử Dụng Nguyên Liệu Hữu Cơ, Phân Bón Hữu Cơ Phối Hợp Phân Vô Cơ Cho Sản Xuất Rau An Toàn (17 trang) | Cục Bảo vệ Thực vật - Bộ NN&PTNT (GS.TS. Phạm Văn Cường, TS. Trần Thị Minh Thu...) | [210219_pl_qt_tbkt_rau_an_toanpdf.pdf](file:///d:/S5/Farmely/docs/210219_pl_qt_tbkt_rau_an_toanpdf.pdf) | Quy chuẩn liều lượng NPK quy đổi, kỹ thuật ủ hoai phân chuồng thay thế 50% vô cơ, phác đồ bón lót và bón thúc cho 10 loại rau của Farmely. |
| **3** | **QĐ 288/QĐ-BVTV-KH** | Công Nhận Tiến Bộ Kỹ Thuật Sản Xuất Rau Hữu Cơ Tiêu ChuẢn Quốc Gia (14 trang) | Cục Bảo vệ Thực vật - Bộ NN&PTNT (Ban hành ngày 01/03/2021) | [21.03,01_QD288 TBKT rau huu cơ.pdf](file:///d:/S5/Farmely/docs/21.03,01_QD288%20TBKT%20rau%20huu%20c%C6%A1.pdf) | Cơ sở pháp lý kiểm soát vùng đệm cách ly môi trường, tiêu chuẩn đất trồng không tồn dư kim loại nặng, cấm phân bón hóa học độc hại. |
| **4** | **IPM-2025/BVTV** | Quy Trình Quản Lý Dịch Hại Tổng Hợp (IPM) Trên Cây Trồng Nông Nghiệp (19 trang) | Cục Bảo vệ Thực vật / Chi cục Trồng trọt & BVTV (Ban hành ngày 07/01/2025) | [quy_trinh_ipm_na_712025pdf.pdf](file:///d:/S5/Farmely/docs/quy_trinh_ipm_na_712025pdf.pdf) | Quy chuẩn giám sát bẫy dính vàng, bẫy pheromone, bảo vệ thiên địch và biện pháp can thiệp sinh học theo ngưỡng kinh tế gây hại (ET). |
| **5** | **TBKT 01-114: 2021/BVTV** | Quy Trình Quản Lý Tổng Hợp Sâu Bệnh Hại & Nấm Đối Kháng Sinh Học (10 trang) | Cục Bảo vệ Thực vật - Bộ NN&PTNT (TS. Nguyễn Văn Liêm, ThS. Lê Đình Thao...) | [211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf](file:///d:/S5/Farmely/docs/211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf) | Cơ sở sử dụng vi sinh đối kháng *Trichoderma* phòng trừ nấm hại rễ, héo xanh vi khuẩn, không dùng thuốc trừ nấm gốc hóa học độc hại. |

* **Sample Data (Đồng bộ PostgreSQL & Frontend URL):**
```sql
INSERT INTO knowledge_documents (document_id, kd_created_by, title, content, file_url, created_at) VALUES
-- 1. Sách hướng dẫn VietGAP Quốc gia (Khuyến Nông Quốc Gia)
(1, 5, 'Sách Hướng Dẫn Đào Tạo Sản Xuất Rau An Toàn Theo VietGAP', 
 'Tài liệu hướng dẫn chuẩn quốc gia 200 trang gồm 12 module: Đánh giá vùng đất, giá thể, nguồn nước, phân bón hữu cơ, bảo vệ thực vật sinh học, cách ly PHI và truy xuất nguồn gốc.', 
 '/docs/rau_an_toan_vietgap_huyen.pdf', NOW() - INTERVAL '30 days'),

-- 2. Tiến bộ kỹ thuật Phân bón hữu cơ rau an toàn (Cục BVTV)
(2, 5, 'Quy Trình Sử Dụng Nguyên Liệu Hữu Cơ, Phân Bón Hữu Cơ Phối Hợp Phân Vô Cơ Cho Sản Xuất Rau An Toàn (TBKT 01-104: 2021/BVTV)', 
 'Tiến bộ kỹ thuật ban hành bởi Cục BVTV - Bộ NN&PTNT hướng dẫn định mức N-P-K quy đổi, ủ hoai phân chuồng thay thế 50% vô cơ và phác đồ dinh dưỡng cho từng nhóm rau.', 
 '/docs/210219_pl_qt_tbkt_rau_an_toanpdf.pdf', NOW() - INTERVAL '25 days'),

-- 3. Quyết định công nhận TBKT Rau hữu cơ (Cục BVTV)
(3, 5, 'Quyết Định 288/QĐ-BVTV-KH Công Nhận Tiến Bộ Kỹ Thuật Sản Xuất Rau Hữu Cơ Tiêu Chuẩn Quốc Gia', 
 'Quyết định pháp lý công nhận quy trình kỹ thuật sản xuất rau hữu cơ, kiểm soát vùng đệm cách ly môi trường, cấm hóa chất độc hại và kim loại nặng.', 
 '/docs/21.03,01_QD288 TBKT rau huu cơ.pdf', NOW() - INTERVAL '22 days'),

-- 4. Quy trình Quản lý dịch hại tổng hợp IPM (Cục BVTV)
(4, 6, 'Quy Trình Quản Lý Dịch Hại Tổng Hợp (IPM) Trên Cây Trồng Nông Nghiệp', 
 'Quy trình kỹ thuật IPM cập nhật ban hành 2025 quy định cơ chế bẫy dính vàng, bẫy pheromone, bảo vệ sinh thái thiên địch và ngưỡng phòng trừ sinh học an toàn.', 
 '/docs/quy_trinh_ipm_na_712025pdf.pdf', NOW() - INTERVAL '18 days'),

-- 5. Quản lý sinh vật gây hại & nấm đối kháng Trichoderma (Cục BVTV)
(5, 6, 'Quy Trình Quản Lý Tổng Hợp Sâu Bệnh Hại & Nấm Đối Kháng Sinh Học (TBKT 01-114: 2021/BVTV)', 
 'Quy trình phòng trừ nấm bệnh thối rễ, xì mủ, héo xanh bằng nấm đối kháng Trichoderma sinh học và chế phẩm sinh học thân thiện môi trường.', 
 '/docs/211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf', NOW() - INTERVAL '15 days')
ON CONFLICT (document_id) DO NOTHING;
```

---

## 4. HƯỚNG DẪN TÍCH HỢP CHO FRONTEND VÀ BACKEND

### Các bước thay thế Mock Data ở Frontend:
1. **Thay thế Chat Storage (`chatStorage.js`):**
   - Chuyển `useRealtimeChat` sang gọi API `GET /api/v1/conversations` và `GET /api/v1/conversations/{id}/messages` từ `communication-service` (cổng 8087).
2. **Thay thế Dịch vụ & Thanh toán (`VietQrModal.jsx`):**
   - Gọi `POST /api/v1/payments/vietqr/generate` và `POST /api/v1/payments/{id}/confirm` từ `payment-service` (cổng 8085).
3. **Thay thế Marketplace & GIS Data (`marketplaceGisData.js`):**
   - Viết API `GET /api/v1/plots` và `GET /api/v1/lands` từ `farm-service` (cổng 8082).
4. **Thay thế Dashboard Khách hàng (`CustomerDashboard.jsx`):**
   - Gọi `GET /api/v1/rentals/customer/{userId}` từ `rental-service` (cổng 8084).
   - Gọi `GET /api/v1/monitoring/plots/{plotId}/telemetry` từ `monitoring-service` (cổng 8088).
5. **Thay thế Dashboard Công nhân (`FieldWorkerDashboard.jsx`):**
#### Bảng process_templates & 	emplate_steps (10 PHÁC ĐỒ VIETGAP CHUẨN CHO 10 LOÀI RAU)
