# ĐẶC TẢ DANH MỤC THỰC THỂ DỮ LIỆU (ENTITY SPECIFICATION)
## Môn học: ISP392 – Information System Programming Project
**Nguồn gốc trích xuất:** `docs/requirements/research-proposal.md` v2.1 (27 Business Rules BR01–BR27) · `docs/requirements/user-stories.md` v2.2 (9 Epics, 52 US) · `docs/architecture/use-case-spec.md` (5 phân hệ, 52 UC)
**Phiên bản:** 1.1 — Cập nhật: 27/09/2026 (tinh gọn IoT theo RP §10.3: Mock-only, không phần cứng)
**Chuẩn CSDL:** PostgreSQL 15+ · 3NF · Naming: `snake_case`

---

## 1. PHƯƠNG PHÁP XÁC ĐỊNH THỰC THỂ (ENTITY IDENTIFICATION METHOD)

Áp dụng quy trình chuẩn ISAD (*Kendall & Kendall* / *Dennis–Wixom–Roth*):

1. **Bước 1 – Trích danh từ:** Quét toàn bộ 27 BR + 52 User Stories + 52 Use Cases, thu thập mọi **danh từ** chỉ đối tượng/sự kiện mà hệ thống phải lưu trữ lâu dài.
2. **Bước 2 – Gộp đồng nghĩa & loại thuộc tính:** Gộp các tên trùng nghĩa (`Farm Diary` ≡ `FarmDiaryEntry`); loại các danh từ chỉ **thuộc tính** (giá thuê, buffer time, loại đất, tọa độ GPS) hoặc **trạng thái** (Confirmed, Overdue...).
3. **Bước 3 – Phân loại:** Master Data (danh mục) / Transaction (giao dịch) / Operational (vận hành) / Monitoring & Support (giám sát – hỗ trợ) / Log (nhật ký).
4. **Bước 4 – Truy vết:** Mỗi thực thể PHẢI truy vết ngược về ≥ 1 BR hoặc ≥ 1 US. Không có thực thể "mồ côi" không nguồn gốc.
5. **Bước 5 – Xác định quan hệ & bản số:** 1–1 / 1–N / N–N (N–N phải tách bảng kết hợp).

**Nguyên tắc loại trừ (thứ KHÔNG phải thực thể):**

| Ứng viên | Kết luận | Lý do |
| :--- | :---: | :--- |
| `Cultivation Mode` (Self/Assisted) | ❌ Không phải thực thể | Enum cột trên `reservation`/`rental` (BR05, BR11) |
| Các trạng thái (`CONFIRMED`, `OVERDUE`, `QUOTED`...) | ❌ | Enum cột trạng thái |
| `Giá thuê`, `Buffer Time`, `Loại thổ nhưỡng`, `Tọa độ GPS` | ❌ | Thuộc tính của Plot/Variety/Land |
| `Lịch sử chat AI Chatbot` | ❌ | RP v2.1 §10.2: "AI Chatbot không có memory, mỗi câu hỏi xử lý độc lập" |
| `Payroll / Chấm công CVLĐ` | ❌ | RP v2.1 §10.2: Out-of-Scope |
| `Trạm IoT phần cứng / MQTT / Quản lý thiết bị` | ❌ | RP §10.3: "IoT mock data... không kết nối phần cứng thật" — quyết định scope 27/09/2026. Không có bảng thiết bị; mã trạm đo là cột `plot.iot_device_code` |
| `Chủ đất ngoài (C2C)` | ❌ | BR01: nền tảng là chủ trang trại duy nhất |
| `Múi giờ`, `Đa ngôn ngữ` | ❌ | RP v2.1 §10.2: Out-of-Scope |

---

## 2. TỔNG QUAN: 35 THỰC THỂ — 5 CỤM NGHIỆP VỤ

| Cụm | Số lượng | Vai trò | Mức ưu tiên MVP |
| :--- | :---: | :--- | :--- |
| **A. Định danh & Truy cập** | 3 | Tài khoản, RBAC, kiểm toán | T0 |
| **B. Tài nguyên & Tri thức nông học** | 11 | Đất, cây, quy trình chuẩn, vật tư, RAG | T0 |
| **C. Giao dịch Thuê & Dịch vụ** | 7 | Giữ chỗ, hợp đồng, thanh toán, hoàn tiền, dịch vụ lẻ | T0 |
| **D. Kế hoạch & Vận hành hiện trường** | 7 | Kế hoạch, phiên bản, tác vụ, nghiệm thu, sự cố | T0 |
| **E. Giám sát, Hỗ trợ & Kết thúc** | 7 | Tư vấn, chat, IoT, nhật ký, thu hoạch, thông báo | T0/T1 |
| **TỔNG** | **35** | | 19 T0 + 16 T1 |

> Đối chiếu mục 7.1 RP v2.1 (16 thực thể nền): `User, Role, Plot, Crop, Variety, StandardProcessTemplate, Reservation, Rental, PaymentTransaction, CultivationPlan, CareTask, FarmDiary, HarvestResult, SensorReading, IssueReport, ServiceRequest` → **đủ 16/16** ✅ (được mở rộng lên 35 nhờ phân rã chuẩn 3NF từ 27 BR).

---

## 3. DANH MỤC CHI TIẾT 35 THỰC THỂ

Ký hiệu: **PK** = Khóa chính · **FK** = Khóa ngoại · **UQ** = Unique.

### CỤM A — ĐỊNH DANH & TRUY CẬP (3)

#### A1. `user` — Người dùng hệ thống *(BR01, BR24; US1.1–US1.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `role_id` FK→role · `email` UQ · `password_hash` · `full_name` · `phone` UQ · `address` · `avatar_url` · `status` ENUM(ACTIVE, LOCKED) · `created_at` | Mọi người dùng thuộc 1 trong 4 vai: KH, CGNN, CVLĐ, AD. Phân quyền dữ liệu theo BR24 qua `role_id`. |

#### A2. `role` — Vai trò RBAC *(BR24; US1.2, US1.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `code` UQ (ROLE_CUSTOMER, ROLE_EXPERT, ROLE_STAFF, ROLE_ADMIN) · `name_vn` | Danh mục 4 vai trò cố định. 1 role — N user. |

#### A3. `audit_log` — Nhật ký kiểm toán hệ thống *(US1.4, US9.5; AD Dashboard §6)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `actor_user_id` FK→user NULL · `action_type` · `entity_type` · `entity_id` · `ip_address` · `description` · `created_at` | Ghi nhận: đăng nhập thất bại, thay đổi quyền, khóa tài khoản (kèm lý do), chuyển trạng thái Plot/Rental, giao dịch thanh toán. |

### CỤM B — TÀI NGUYÊN & TRI THỨC NÔNG HỌC (11)

#### B1. `land` — Khu đất / Trang trại *(BR01; US2.1, UC-ADM03)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `name` · `address` · `gps_lat` · `gps_lng` (phục vụ Weather API) · `total_area_sqm` · `main_soil_type` · `water_source` · `status` ENUM(OPERATING, SUSPENDED) | Nền tảng sở hữu & vận hành trực tiếp (BR01). Prototype: 1 trang trại, ≤ 50 Plot. |

#### B2. `plot` — Thửa đất cho thuê *(BR02, BR23; US2.2, UC-ADM05)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `land_id` FK→land · `plot_code` UQ (vd L01-P01) · `iot_device_code` (mã trạm đo mock — UC-ADM05) · `area_sqm` · `daily_rent_price` · `soil_type` · `water_source` · `technical_condition` · `status` ENUM(PREPARING, PUBLISHED, RESERVED, RENTED, MAINTENANCE) · `listing_status` ENUM(HIDDEN, PUBLISHED) | Đơn vị cho thuê nhỏ nhất. **BR23:** sau khi Rental kết thúc → `MAINTENANCE` (dọn dẹp/cải tạo nội bộ) rồi mới quay lại `PUBLISHED`. |

#### B3. `crop` — Loài cây trồng *(BR03; US4.1)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `name` (Cải ngọt, Xà lách...) · `scientific_name` · `category` (Rau ăn lá, Rau củ...) | Danh mục loài, do CGNN quản trị. |

#### B4. `variety` — Giống cây cụ thể *(BR03, BR04; US4.1)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `crop_id` FK→crop · `name` (Cải ngọt F1) · `growth_duration_days` · `buffer_days` (mặc định 7) · `expected_yield_kg_sqm` · `optimal_season` · `pest_resistance` · `is_active` | **BR04:** thời gian thuê ≥ `growth_duration_days + buffer_days`. |

#### B5. `plot_crop_compatibility` — Tương thích Thổ nhưỡng–Cây (Bảng kết hợp) *(BR03; US2.3, US4.2, UC-EXP01)*
| PK: `(plot_id, variety_id)` | Định nghĩa |
| :--- | :--- |
| `plot_id` FK · `variety_id` FK · `suitability` ENUM(OPTIMAL, ACCEPTABLE) · `notes` · `configured_by_expert_id` FK→user | KH chỉ được chọn Variety nằm trong danh mục này. N–N giữa Plot và Variety. |

#### B6. `standard_process_template` — Quy trình canh tác chuẩn *(BR16; US4.3, UC-EXP03)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `variety_id` FK→variety · `expert_id` FK→user · `name` · `version` (v1.0, v2.0...) · `status` ENUM(DRAFT, PUBLISHED, DEPRECATED) · `published_at` | Khuôn mẫu do CGNN biên soạn: nguồn sinh Cultivation Plan (Assisted) & cẩm nang Read-only (Self-growing, BR11). |

#### B7. `growth_stage` — Giai đoạn sinh trưởng + ngưỡng IoT *(UC-EXP04; US4.3, US4.5)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `template_id` FK→template · `stage_order` · `name` (Ươm hạt, Phát triển cây con...) · `start_day_offset` · `end_day_offset` · `watering_frequency_per_day` · `water_norm_l_sqm` · `min_temp` · `max_temp` · `min_air_humidity` · `max_air_humidity` · `min_soil_moisture` · `max_soil_moisture` | Ngưỡng min/max là căn cứ kích hoạt `EnvironmentalAlert` (BR18). |

#### B8. `task_template` — Đầu việc mẫu trong giai đoạn *(US4.3, US4.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `stage_id` FK→growth_stage · `task_order` · `name` · `task_type` ENUM(WATERING, FERTILIZING, PEST_CONTROL, WEEDING, HARVEST) · `day_offset` · `instructions_markdown` | Bước công việc cụ thể; là bản mẫu để sinh `care_task` thực tế. |

#### B9. `template_material_norm` — Định mức vật tư theo đầu việc (Bảng kết hợp) *(BR16; US4.4)*
| PK: `(task_template_id, material_id)` | Định nghĩa |
| :--- | :--- |
| `task_template_id` FK · `material_id` FK · `quantity_per_sqm` (vd 0.5 kg/m²) | **BR16:** lượng vật tư khai báo của CVLĐ phải đối chiếu định mức này. |

#### B10. `material` — Danh mục vật tư *(BR16; US4.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `name` (Phân trùn quế, Chế phẩm sinh học...) · `unit` (kg, lít) · `unit_price` · `stock_quantity` | Kho vật tư; trừ kho qua `material_usage`. |

#### B11. `professional_source_document` — Kho tài liệu chuyên môn (RAG) *(BR19; US4.6, UC-EXP05)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `expert_id` FK→user · `title` · `category` · `file_url` · `status` · `uploaded_at` | Nguồn tri thức cho AI Chatbot (RAG) — do CGNN thẩm định. |

### CỤM C — GIAO DỊCH THUÊ & DỊCH VỤ (7)

#### C1. `reservation` — Đơn giữ chỗ tạm thời *(BR07, BR08; US3.4–US3.6)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `customer_id` FK→user · `plot_id` FK→plot · `variety_id` FK→variety · `cultivation_mode` ENUM(SELF, ASSISTED) · `start_date` · `end_date` · `total_amount` · `status` ENUM(HOLDING, PAYMENT_PENDING, CONVERTED, EXPIRED, CANCELLED) · `lock_created_at` · `lock_expires_at` (TTL 15 phút) · `grace_until` (+3 phút khi PAYMENT_PENDING) · `converted_at` | Khóa giữ chỗ chống trùng lịch. Quá hạn → EXPIRED, mở lại Plot (BR08). Chọn luôn cultivation_mode tại bước này (BR05). |

#### C2. `rental` — Hợp đồng thuê & canh tác *(BR05, BR09, BR10, BR22; US3.6, US3.7)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `reservation_id` FK→reservation **UQ** NULL · `customer_id` FK→user · `plot_id` FK→plot · `variety_id` FK→variety · `cultivation_mode` · `start_date` · `end_date` · `rent_amount` · `service_fee` · `total_paid` · `status` ENUM(CONFIRMED, ACTIVE, COMPLETED, TERMINATED) · `activated_at` · `completed_at` | Trọng tâm dữ liệu. Sinh sau thanh toán 100% thành công; CONFIRMED → ACTIVE (đến Start Date) → COMPLETED (đến End Date, chỉ đọc BR22); TERMINATED khi hủy (BR10). |

#### C3. `payment_transaction` — Giao dịch thanh toán *(BR09, BR27; US3.6, US7.5)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `rental_id` FK→rental NULL · `service_request_id` FK→service_request NULL · `txn_ref` UQ · `amount` · `method` ENUM(MOCK_CARD, MOCK_WALLET) · `status` ENUM(PENDING, SUCCESS, FAILED) · `bank_payload` · `paid_at` | Thanh toán tiền thuê trọn gói 100% và phí dịch vụ lẻ. Mock Gateway (không tích hợp thật — RP §10.2). |

#### C4. `refund_record` — Hoàn tiền khi hủy hợp đồng *(BR10; US3.7)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `payment_transaction_id` FK→payment_transaction · `rental_id` FK→rental · `refund_rate` (0.8 / 0.5 / 0.0) · `amount` · `reason` · `status` ENUM(PROCESSING, DONE) · `refunded_at` | **BR10:** ≥ 3 ngày trước Start Date: 80%; < 3 ngày: 50%; đã ACTIVE: 0%. 1 giao dịch có thể hoàn nhiều đợt. |

#### C5. `service_catalog` — Danh mục dịch vụ lẻ *(BR27; US2.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `name` (Tưới nước khẩn cấp 50.000đ/lần...) · `description` · `unit_price` · `is_active` | Bảng giá do AD cấu hình; căn cứ báo giá Service Request. |

#### C6. `service_request` — Yêu cầu dịch vụ phát sinh *(BR27, BR18; US7.5, US6.2)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `customer_id` FK→user · `rental_id` FK→rental · `catalog_id` FK→service_catalog NULL · `request_type` ENUM(ADHOC, QUICK_RESCUE) · `description` · `status` ENUM(PENDING, QUOTED, APPROVED, REJECTED, COMPLETED) · `created_at` | **BR27:** KH tạo PENDING → AD review & báo giá QUOTED → KH duyệt + thanh toán APPROVED / từ chối REJECTED → sinh care_task → COMPLETED. QUICK_RESCUE từ cảnh báo IoT của Self-growing (BR18). |

#### C7. `service_quote` — Báo giá dịch vụ *(BR27)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `service_request_id` FK→service_request · `admin_id` FK→user · `estimated_amount` · `note` · `status` ENUM(PENDING, ACCEPTED, REJECTED) · `created_at` | 1 Request có thể có nhiều lần báo giá (KH từ chối → AD báo lại). |

### CỤM D — KẾ HOẠCH & VẬN HÀNH HIỆN TRƯỜNG (7)

#### D1. `cultivation_plan` — Kế hoạch canh tác *(BR12, BR19; US5.2–US5.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `rental_id` FK→rental **UQ** NULL (chỉ Assisted) · `expert_id` FK→user · `template_id` FK→template · `status` ENUM(DRAFT, PENDING_APPROVAL, ACTIVE, SUPERSEDED) · `approval_deadline` (48h hoặc 00:00 ngày Start Date) · `auto_approved` BOOL · `approved_at` | Do **CGNN lập** (AI chỉ hỗ trợ tra cứu — BR19). Quá hạn → Auto-Approve kế hoạch chuẩn (BR12). |

#### D2. `plan_version` — Phiên bản kế hoạch *(BR13; US5.5)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `plan_id` FK→cultivation_plan · `version_no` · `status` ENUM(DRAFT, PENDING_APPROVAL, ACTIVE, REJECTED) · `created_by_expert_id` FK→user · `approved_at` | **BR13:** mọi thay đổi phải tạo version mới, CGNN review + KH duyệt trước khi áp dụng cho task tương lai. |

#### D3. `care_task` — Tác vụ chăm sóc hiện trường *(BR14, BR15, BR18; US6.1–US6.5)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `plan_version_id` FK→plan_version NULL · `plot_id` FK→plot · `rental_id` FK→rental NULL · `task_template_id` FK NULL · `service_request_id` FK NULL · `assigned_staff_id` FK→user NULL · `task_type` ENUM(ROUTINE, EMERGENCY, SERVICE) · `name` · `scheduled_date` · `due_date` (23:59) · `status` ENUM(PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, OVERDUE, SKIPPED) · `actual_start_at` · `actual_finish_at` · `notes` | ROUTINE từ plan được duyệt; EMERGENCY từ cảnh báo IoT giờ hành chính (BR18); SERVICE từ Service Request được duyệt. **BR14:** quá 23:59 chưa COMPLETED → OVERDUE. |

#### D4. `task_evidence_photo` — Ảnh minh chứng thực địa *(BR15; US6.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `task_id` FK→care_task · `photo_url` · `gps_lat` · `gps_lng` · `uploaded_at` | **BR15:** ≥ 1 ảnh mới cho phép COMPLETED. Giới hạn 5MB/ảnh, 10 ảnh/task (RP §10.2). |

#### D5. `material_usage` — Vật tư tiêu hao theo task *(BR16; US6.4)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `task_id` FK→care_task · `material_id` FK→material · `quantity_used` · `is_abnormal` BOOL · `note` | Đối chiếu định mức `template_material_norm`; bất thường → ghi cờ xử lý (BR16). |

#### D6. `issue_report` — Báo cáo sự cố hiện trường *(BR25; US6.6, US8.3)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `plot_id` FK→plot · `rental_id` FK NULL · `staff_id` FK→user · `title` · `description` · `photo_urls` · `severity` ENUM(LOW, MEDIUM, HIGH) · `status` ENUM(OPEN, IN_PROGRESS, RESOLVED) · `created_at` | CVLĐ phát hiện bất thường (sâu bệnh, gãy cành, đất khô) → báo CGNN chỉ đạo kỹ thuật. |

#### D7. `issue_comment` — Trao đổi kỹ thuật trên sự cố *(BR25; US8.3)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `issue_id` FK→issue_report · `sender_id` FK→user · `message` · `image_url` · `created_at` | Kênh chat riêng CVLĐ ↔ CGNN trong phạm vi 1 sự cố. |

### CỤM E — GIÁM SÁT, HỖ TRỢ & KẾT THÚC (7)

#### E1. `consultation_ticket` — Phiên tư vấn *(BR06, BR25; US3.3, US8.1–US8.2)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `customer_id` FK→user · `expert_id` FK→user NULL · `ticket_type` ENUM(PRE_RENTAL, IN_RENTAL) · `plot_id` FK NULL · `rental_id` FK NULL · `subject` · `status` ENUM(OPEN, IN_PROGRESS, CLOSED) · `created_at` | PRE_RENTAL (tùy chọn, không khóa Plot — BR06) và IN_RENTAL (sâu bệnh trong kỳ thuê). |

#### E2. `chat_message` — Tin nhắn trong phiên tư vấn *(BR25; US8.2)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `ticket_id` FK→consultation_ticket · `sender_id` FK→user · `content` · `image_url` · `created_at` | Kênh KH ↔ CGNN; CGNN xem kèm dữ liệu IoT + Farm Diary để ra phác đồ. |

#### E3. `sensor_reading` — Số đo vi khí hậu (Mock-only) *(BR18; US7.4, UC-CUS09; RP §10.3)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `plot_id` FK→plot · `recorded_at` · `air_temp` (°C) · `air_humidity` (%) · `soil_moisture` (%) · `source` ENUM(MOCK) · **UQ(`plot_id`, `recorded_at`)** | Time-series do **Mock Sensor Service** sinh ngẫu nhiên chu kỳ 3 giờ/lần — không kết nối phần cứng thật (RP §10.3). Không có bảng thiết bị; mã trạm đo nằm ở cột `plot.iot_device_code` (UC-ADM05). |

#### E4. `environmental_alert` — Cảnh báo môi trường vượt ngưỡng *(BR18; US7.7, US4.5)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `plot_id` FK→plot · `rental_id` FK NULL · `stage_id` FK NULL · `alert_type` ENUM(TEMP_HIGH, TEMP_LOW, HUMIDITY_LOW, SOIL_DRY, SOIL_SATURATED, HEAVY_RAIN_FORECAST) · `threshold_value` · `measured_value` · `action_taken` ENUM(EMERGENCY_TASK, SMS_ADMIN, NOTIFY_SELF, QUICK_SERVICE, TASK_PAUSE) · `care_task_id` FK NULL · `service_request_id` FK NULL · `resolved_at` | Kích hoạt khi vượt ngưỡng kéo dài > 30 phút (BR18) — do **Mock Alert Evaluator** (scheduled job, không phần cứng) đánh giá trên `sensor_reading`: Assisted + giờ hành chính → EMERGENCY_TASK; ngoài giờ → SMS_ADMIN; Self → NOTIFY_SELF/QUICK_SERVICE; mưa lớn/ẩm ≥ 80% → TASK_PAUSE. Bảng log mỏng để truy vết mỗi lần kích hoạt + action đã xử lý. |

#### E5. `farm_diary_entry` — Nhật ký nông trại *(BR17; US7.2, US7.3)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `rental_id` FK→rental · `task_id` FK→care_task NULL · `created_by_user_id` FK→user NULL · `entry_type` ENUM(AUTO_TASK_SYNC, CUSTOMER_NOTE) · `entry_date` · `title` · `content` · `photo_urls` | AUTO_TASK_SYNC: tự sinh khi task COMPLETED (BR17); CUSTOMER_NOTE: KH tự ghi (Self-growing). |

#### E6. `harvest_result` — Kết quả thu hoạch *(BR20, BR21; US9.1, UC-CUS14)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `rental_id` FK→rental **UQ** · `harvest_date` · `actual_yield_kg` · `photo_urls` · `quality_grade` · `disposal_method` ENUM(SELF_RECEIVE, SELL, GIFT) · `confirmed_by_user_id` FK→user · `status` | **BR20:** tối thiểu ngày, ảnh, sản lượng + xác nhận người có thẩm quyền. **BR21:** sản lượng thuộc KH, KH quyết cách xử lý. |

#### E7. `notification` — Thông báo trong ứng dụng *(BR18; US6.5, US7.7)*
| PK: `id` | Định nghĩa |
| :--- | :--- |
| `recipient_user_id` FK→user · `type` · `title` · `content` · `link` · `is_read` BOOL · `created_at` | In-app cho KH (vườn được chăm sóc xong, cảnh báo môi trường); SMS/Push cho AD ngoài giờ hành chính (BR18). |

---

## 4. MA TRẬN QUAN HỆ & BẢN SỐ (RELATIONSHIP MATRIX)

| # | Quan hệ | Bản số | Chiều | Chú giải nghiệp vụ |
| :---: | :--- | :---: | :---: | :--- |
| R01 | `role` → `user` | 1–N | — | 4 vai trò cố định (BR24) |
| R02 | `user` → `audit_log` | 1–N | actor | Mọi thao tác quản trị được truy vết |
| R03 | `land` → `plot` | 1–N | — | Chia khu đất thành thửa (US2.2) |
| R04 | `plot` → `sensor_reading` | 1–N | — | Time-series mock 3 giờ/lần (BR18, RP §10.3) |
| R05 | `crop` → `variety` | 1–N | — | Phân loại sinh học (US4.1) |
| R06 | `plot` ↔ `variety` | N–N | qua `plot_crop_compatibility` | Tương thích thổ nhưỡng (BR03) |
| R07 | `variety` → `standard_process_template` | 1–N | — | 1 giống nhiều phiên bản quy trình |
| R08 | `standard_process_template` → `growth_stage` | 1–N | — | Giai đoạn + ngưỡng IoT (US4.3/4.5) |
| R09 | `growth_stage` → `task_template` | 1–N | — | Đầu việc trong giai đoạn |
| R10 | `task_template` ↔ `material` | N–N | qua `template_material_norm` | Định mức vật tư (BR16) |
| R11 | `user`(CGNN) → `professional_source_document` | 1–N | — | Kho RAG do CGNN thẩm định (BR19) |
| R12 | `user`(KH) → `reservation` | 1–N | — | Đặt chỗ |
| R13 | `plot` → `reservation` | 1–N | — | Chống trùng lịch (BR07) |
| R14 | `reservation` → `rental` | 1–0..1 | — | Chỉ sinh hợp đồng khi Converted (BR09) |
| R15 | `rental` → `payment_transaction` | 1–N | — | Thanh toán 100% upfront (BR09) |
| R16 | `payment_transaction` → `refund_record` | 1–N | — | 1 giao dịch hoàn nhiều đợt (BR10) |
| R17 | `service_catalog` → `service_request` | 1–N | — | Danh mục giá dịch vụ (BR27) |
| R18 | `rental` → `service_request` | 1–N | — | Dịch vụ phát sinh trong kỳ thuê |
| R19 | `service_request` → `service_quote` | 1–N | — | Báo giá nhiều vòng (BR27) |
| R20 | `rental` → `cultivation_plan` | 1–0..1 | — | Chỉ Assisted-growing (BR11/BR12) |
| R21 | `cultivation_plan` → `plan_version` | 1–N | — | Version hóa kế hoạch (BR13) |
| R22 | `plan_version` → `care_task` | 1–N | — | Sinh task từ version được duyệt |
| R23 | `care_task` → `task_evidence_photo` | 1–N | — | ≥1 ảnh bắt buộc (BR15) |
| R24 | `care_task` → `material_usage` | 1–N | — | Tiêu hao vật tư (BR16) |
| R25 | `care_task` → `farm_diary_entry` | 1–0..1 | — | Tự đồng bộ khi Completed (BR17) |
| R26 | `plot` → `issue_report` | 1–N | — | Sự cố tại thửa |
| R27 | `issue_report` → `issue_comment` | 1–N | — | Chat kỹ thuật CVLĐ↔CGNN (BR25) |
| R28 | `user`(KH) → `consultation_ticket` | 1–N | — | Tư vấn trước thuê & trong kỳ (BR06/BR25) |
| R29 | `consultation_ticket` → `chat_message` | 1–N | — | Chat KH↔CGNN |
| R30 | `plot` → `environmental_alert` | 1–N | — | Cảnh báo vượt ngưỡng (Mock Evaluator) |
| R31 | `environmental_alert` → `care_task` | 1–0..1 | — | Emergency Task (BR18) |
| R32 | `environmental_alert` → `service_request` | 1–0..1 | — | Quick Rescue (BR18) |
| R33 | `rental` → `farm_diary_entry` | 1–N | — | Nhật ký theo hợp đồng |
| R34 | `rental` → `harvest_result` | 1–1 | — | 1 hợp đồng – 1 kết quả thu hoạch (BR20) |
| R35 | `user` → `notification` | 1–N | — | Hộp thư cá nhân |
| R36 | `user`(KH) → `rental` | 1–N | — | Lịch sử thuê |
| R37 | `user`(CGNN) → `cultivation_plan` | 1–N | — | Kế hoạch do CGNN lập |
| R38 | `user`(CVLĐ) → `care_task` | 1–N | — | Phân công ca trực (BR14) |
| R39 | `user` → `harvest_result` | 1–N | confirmed_by | Xác nhận thu hoạch (BR20) |

---

## 5. PHÂN HẠNG TRIỂN KHAI THEO ITERATION (ĐỊNH MỨC LOC ISP392)

| Iteration | Nhóm thực thể (bảng) | Số bảng |
| :---: | :--- | :---: |
| **Iteration 1** (180 LOC/người) | A1–A2, B1–B4, C1–C3 (Đăng ký, quản lý Plot, Marketplace, giữ chỗ, thanh toán) | 9 |
| **Iteration 2** (tích lũy 240) | B5–B11, C5–C7 (Tri thức nông học, quy trình chuẩn, dịch vụ lẻ) | 10 |
| **Iteration 3** (tích lũy 660) | D1–D7, E1–E5 (Kế hoạch, task, nghiệm thu, IoT, diary, chat) | 12 |
| **Final** (tích lũy 720) | A3, C4, E6–E7 (Audit, Refund, Harvest, Notification — hoàn thiện & tối ưu) | 4 |
| **TỔNG** | | **35** |

---

## 6. KIỂM TRA CHUẨN HÓA 3NF (SƠ BỘ)

| Quy tắc | Trạng thái |
| :--- | :---: |
| 1NF: mọi cột nguyên tử, không nhóm lặp | ✅ (ảnh tách bảng `task_evidence_photo`, `farm_diary_entry.photo_urls` là JSONB array hợp lệ PostgreSQL) |
| 2NF: không phụ thuộc một phần khóa ghép | ✅ (các bảng kết hợp chỉ giữ thuộc tính phụ thuộc đủ cặp khóa) |
| 3NF: không phụ thuộc bắc cầu | ✅ (`daily_rent_price` thuộc Plot không phải Rental; `growth_duration_days` thuộc Variety không lặp trên Rental) |
| N–N tách bảng kết hợp | ✅ 3 bảng: `plot_crop_compatibility`, `template_material_norm`, (`service_quote` là 1–N có lịch sử) |

---

## 7. TỆP KÈM THEO

- Sơ đồ ERD khái niệm (PlantUML): [`../diagrams/07_ERD_Conceptual.puml`](../diagrams/07_ERD_Conceptual.puml)
- Ảnh PNG kết xuất: [`../diagrams/07_ERD_Conceptual.png`](../diagrams/07_ERD_Conceptual.png)
- Bước tiếp theo: DDL `schema.sql` + `seed_data.sql` (PostgreSQL) sinh từ đặc tả này.
