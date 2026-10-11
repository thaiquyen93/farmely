# TÀI LIỆU ĐẶC TẢ SƠ ĐỒ NGỮ CẢNH (CONTEXT DIAGRAM SPECIFICATION)
## Môn học: ISP392 – Information System Programming Project | ISAD Standard
**Dự án:** Nền tảng Thuê Thửa đất & Giám sát Trải nghiệm Canh tác Nông nghiệp Thông minh (AgriTech Platform)  
**Phiên bản:** 3.0 (ISAD Strict & Composite Flows Edition) | **Ngày cập nhật:** 25/09/2026  
**File ảnh kết xuất:** `docs/diagrams/00_Context_Diagram.png`  
**File vector gốc:** `docs/diagrams/00_Context_Diagram.svg`  
**Mã nguồn sơ đồ:** `docs/diagrams/00_Context_Diagram_ISAD_Final.puml`  
**Bản vẽ tương tác web:** `docs/diagrams/context-diagram.html`

---

## 1. TỔNG QUAN PHƯƠNG PHÁP LUẬN (ISAD METHODOLOGY)

Trong quy trình **Phân tích và Thiết kế Hệ thống Thông tin (Information Systems Analysis and Design - ISAD)**, **Sơ đồ Ngữ cảnh (Context Diagram)** là mô hình trừu tượng cao nhất của kỹ thuật **Biểu đồ luồng dữ liệu (Data Flow Diagram - DFD)**.

### 1.1. Ba Trụ Cột Học Thuật Của Context Diagram Chuẩn
1. **Tính Khái Quát Hóa Cao Độ (High-Level Abstraction):**
   * Context Diagram **không bao giờ** phân mảnh luồng dữ liệu thành các trường vi mô hay các hành động bấm nút đơn lẻ.
   * Tất cả các tương tác cùng bản chất nghiệp vụ được đóng gói thành **Luồng dữ liệu tổng hợp (Composite Data Flows)** (chỉ 1–2 luồng cho mỗi chiều vào/ra).
2. **Nguyên lý Hộp Đen Tuyệt Đối (The Black Box Principle):**
   * Toàn bộ hệ thống được trừu tượng hóa thành một hình chữ nhật bo góc duy nhất mang số hiệu **`Tiến trình 0 (Process 0)`**.
   * Bên trong Process 0 **tuyệt đối không chứa bullet points, không chứa mã quy tắc (BR), không chứa cấu trúc bảng CSDL hay các hàm con**.
3. **Ký Pháp Hình Học & Ranh Giới Chuẩn (Gane & Sarson / Yourdon & DeMarco):**
   * **External Entities (Tác nhân ngoài):** Bắt buộc là **Hình chữ nhật góc vuông 90° sắc nét** để phân biệt hoàn toàn với Tiến trình.
   * **Bố cục đối xứng 4 - 4:** 4 Hệ thống/Dịch vụ đối tác công nghệ bên trái $\leftrightarrow$ Tiến trình 0 ở trung tâm $\leftrightarrow$ 4 Tác nhân con người bên phải.
   * **Không bao giờ có kho dữ liệu (Data Store):** Mọi cơ sở dữ liệu đều nằm bên trong Process 0 và chỉ xuất hiện khi phân rã sang DFD Mức 1.

---

## 2. BỐ CỤC 3 CỘT ĐỐI XỨNG & ĐẶC TẢ CÁC THỰC THỂ NGOÀI

Hệ thống kết nối và trao đổi dữ liệu với **8 Thực thể ngoài**, chia đều thành 2 nhóm đối xứng qua Tiến trình 0:

### 2.1. Cột Trái: 4 Hệ Thống Ngoại Vi (External Technology Services)
| Ký Hiệu | Tên Thực Thể Ngoài | Bản Chất Kỹ Thuật | Vai Trò Tương Tác Nghiệp Vụ |
| :---: | :--- | :---: | :--- |
| **`AI`** | **Dịch vụ Trí tuệ Nhân tạo** *(AI Service)* | Đối tác LLM / Engine RAG | Cung cấp tri thức sinh học, phác đồ điều trị sâu bệnh và khuyến nghị canh tác 24/7. |
| **`PAY`** | **Cổng Thanh toán Đối tác** *(Payment Gateway)* | VNPay / VietQR | Xử lý thanh toán hợp đồng thuê trọn gói 100% Upfront và phí dịch vụ phát sinh. |
| **`IOT`** | **Hệ thống Cảm biến IoT** *(Telemetry Hardware)* | Trạm quan trắc vi mạch | Thu thập và truyền liên tục chuỗi số liệu nhiệt độ, độ ẩm đất, độ ẩm khí quyển, ánh sáng. |
| **`WEATHER`** | **Dịch vụ Dự báo Thời tiết** *(Weather Service)* | OpenWeather API | Cung cấp bản tin khí tượng và dự báo thời tiết 7 ngày phục vụ cảnh báo thiên tai, mưa úng. |

### 2.2. Cột Phải: 4 Tác Nhân Con Người (Human Actors / Users)
| Ký Hiệu | Tên Tác Nhân Con Người | Vai Trò Trong Tổ Chức | Mục Đích Tương Tác Với Hệ Thống |
| :---: | :--- | :---: | :--- |
| **`KH`** | **Khách hàng (Người thuê)** *(Customer/Tenant)* | Người tiêu dùng | Tìm kiếm thửa đất, đặt giữ chỗ, thanh toán, duyệt kế hoạch và theo dõi nhật ký mùa vụ. |
| **`CGNN`** | **Chuyên gia Nông nghiệp** *(Agronomy Expert)* | Chuyên gia sinh học | Thiết lập quy chuẩn giống, biên soạn quy trình canh tác, thẩm định kế hoạch và tư vấn bệnh. |
| **`CVLĐ`** | **Chuyên viên Lao động** *(Field Care Staff)* | Nhân viên hiện trường | Tiếp nhận ca trực, thực hiện công việc chăm sóc, chụp ảnh thực địa nghiệm thu và khai báo vật tư. |
| **`AD`** | **Quản trị viên Hệ thống** *(Admin/Farm Owner)* | Ban điều hành | Quy hoạch khu đất, cấu hình bảng giá, phân công nhân sự, phân quyền RBAC và đối soát doanh thu. |

---

## 3. TỪ ĐIỂN 14 LUỒNG DỮ LIỆU TỔNG HỢP (COMPOSITE DATA FLOW DICTIONARY)

Thay vì phân mảnh vụn vặt 25-30 mũi tên gây rối mắt, sơ đồ chuẩn ISAD đóng gói toàn bộ luồng thông tin thành **14 luồng tổng hợp mạch lạc**:

| Mã Luồng | Chiều Di Chuyển | Tên Luồng Dữ Liệu Tổng Hợp | Gói Thuộc Tính Đại Diện (Aggregated Payload) | Nghiệp Vụ Tương Ứng |
| :---: | :---: | :--- | :--- | :--- |
| **`[DF-01]`** | SYS $\rightarrow$ AI | Ngữ cảnh thửa đất & Câu hỏi nông học | `cropVariety, growthStage, soilCondition, pestSymptoms, userQuery` | Gửi context RAG |
| **`[DF-02]`** | AI $\rightarrow$ SYS | Khuyến nghị kỹ thuật & Phác đồ canh tác | `recommendationText, pestTreatmentSteps, confidenceScore` | Trợ lý nông nghiệp 24/7 |
| **`[DF-03]`** | SYS $\rightarrow$ PAY | Yêu cầu thanh toán & Biểu phí trọn gói | `orderId, totalAmount (100% Upfront), rentalDuration, returnUrl` | Thanh toán trả trước |
| **`[DF-04]`** | PAY $\rightarrow$ SYS | Xác nhận kết quả giao dịch thanh toán | `bankTxnNo, paymentStatus (SUCCESS/FAIL), timestamp, ipnSignature` | Webhook ngân hàng |
| **`[DF-05]`** | IOT $\rightarrow$ SYS | Chuỗi dữ liệu quan trắc vi khí hậu định kỳ | `deviceId, plotId, timestamp, airTemp, airHumidity, soilMoisture, lux` | Telemetry 3 giờ/lần |
| **`[DF-06]`** | WEATHER $\rightarrow$ SYS | Bản tin dự báo thời tiết địa phương | `locationCoord, 7DayForecast: [tempMin, tempMax, rainfallProb, alerts]` | Dự báo khí tượng |
| **`[DF-07]`** | KH $\rightarrow$ SYS | Đăng ký, Thuê đất & Duyệt kế hoạch | `accountInfo, plotBookingCriteria, rentalTerms, planApprovalDecision` | Đặt giữ chỗ & Duyệt |
| **`[DF-08]`** | SYS $\rightarrow$ KH | Thông tin thửa đất, Hợp đồng & Nhật ký | `publishedPlotCatalog, activeContractDetails, farmDiaryTimeline, iotDashboard` | Thông tin trả về cho KH |
| **`[DF-09]`** | CGNN $\rightarrow$ SYS | Tiêu chuẩn giống, Quy trình & Kế hoạch | `cropStandards, compatibilityMatrix, standardTemplates, cultivationPlan` | Thiết lập tri thức canh tác |
| **`[DF-10]`** | SYS $\rightarrow$ CGNN | Yêu cầu tư vấn, Sự cố & Cảnh báo vi khí hậu | `consultationRequests, fieldIssueReports (photos), iotAbnormalAlerts` | Đầu bài chuyên môn |
| **`[DF-11]`** | CVLĐ $\rightarrow$ SYS | Báo cáo hoàn thành, Ảnh thực địa & Vật tư | `taskId, mandatoryEvidencePhotoUrl (BR15), materialUsage, shiftStatus` | Nghiệm thu hiện trường |
| **`[DF-12]`** | SYS $\rightarrow$ CVLĐ | Lịch Care Task & Hướng dẫn kỹ thuật | `shiftSchedule, dailyTaskAssignments, plotLocationMap, stepByStepGuide` | Phân công công việc |
| **`[DF-13]`** | AD $\rightarrow$ SYS | Dữ liệu phân lô, Đơn giá thuê & Phân công | `plotZoningData, rentalPricingStructure, staffShiftAllocation, rbacPolicies` | Cấu hình vận hành |
| **`[DF-14]`** | SYS $\rightarrow$ AD | Báo cáo tài chính, Lấp đầy & Audit Log | `revenueMetrics, plotOccupancyRate, staffPerformanceStats, systemAuditLogs` | Báo cáo quản trị |

### 4.1. Luồng dữ liệu giữa KHÁCH HÀNG (KH) và Hệ thống
* **Luồng vào (Input to System):**
  1. `DF-KH-IN-01: Yêu cầu Đăng ký/Hồ sơ:` `{fullName, email, phone, passwordHash}`.
  2. `DF-KH-IN-02: Bộ lọc tìm kiếm Plot:` `{location, areaRange, priceRange, cropType}`.
  3. `DF-KH-IN-03: Yêu cầu tư vấn trước thuê:` `{plotId, intendedCropId, messageText}`.
  4. `DF-KH-IN-04: Đơn yêu cầu giữ chỗ (Reservation Request):` `{plotId, cropVarietyId, startDate, durationDays, packageType (Self/Assisted)}` *(Kích hoạt BR07 – chống trùng lịch; BR08 – khóa giữ chỗ 15 phút)*.
  5. `DF-KH-IN-05: Lệnh chuyển hướng thanh toán:` `{reservationId, paymentMethod}` *(Kích hoạt BR08 - Grace Period 3 phút)*.
  6. `DF-KH-IN-06: Phản hồi duyệt Kế hoạch canh tác:` `{planId, approvalStatus (Approved/Revision_Needed), feedbackNotes}` *(Ràng buộc BR12)*.
  7. `DF-KH-IN-07: Nhật ký canh tác tự ghi (Self-growing):` `{rentalId, entryDate, notes, photos[]}`.
  8. `DF-KH-IN-08: Yêu cầu dịch vụ chăm sóc phát sinh:` `{rentalId, serviceType, targetDate, note}`.
  9. `DF-KH-IN-09: Câu hỏi tư vấn sâu bệnh kèm ảnh lá:` `{rentalId, cropStage, leafImages[], question}`.
  10. `DF-KH-IN-10: Câu hỏi AI Chatbot 24/7:` `{queryPrompt, conversationId}`.

* **Luồng ra (Output from System):**
  1. `DF-KH-OUT-01: Danh mục Plot khả dụng & Chi tiết thổ nhưỡng:` `{plotCode, areaSqm, pricePerDay, soilType, waterSource, iotStatus}`.
  2. `DF-KH-OUT-02: Khuyến nghị tư vấn từ Chuyên gia:` `{consultationId, expertAdvice, recommendedVariety}`.
  3. `DF-KH-OUT-03: Xác nhận giữ chỗ & Thông tin thanh toán:` `{reservationId, lockExpiresAt (15m), totalAmount100Percent, qrPayload}`.
  4. `DF-KH-OUT-04: Hợp đồng thuê đã kích hoạt:` `{contractCode, status: ACTIVE, startDate, harvestExpectedDate}`.
  5. `DF-KH-OUT-05: Dự thảo Kế hoạch canh tác (Cultivation Plan):` `{planId, stages[], tasks[], autoApproveDeadline}`.
  6. `DF-KH-OUT-06: Bảng điều khiển vi khí hậu & Nhật ký Farm Diary:` `{currentTemp, currentHumidity, taskHistory[], evidencePhotos[]}`.
  7. `DF-KH-OUT-07: Phác đồ điều trị sâu bệnh từ Chuyên gia:` `{protocolId, symptomDiagnosis, treatmentInstructions}`.
  8. `DF-KH-OUT-08: Câu trả lời tư vấn từ AI Nông nghiệp:` `{responseAnswer, referenceSources[]}`.
  9. `DF-KH-OUT-09: Biên bản bàn giao thu hoạch:` `{harvestWeightKg, qualityGrade, deliveryDate}`.

### 4.2. Luồng dữ liệu giữa CHUYÊN GIA NÔNG NGHIỆP (CGNN) và Hệ thống
* **Luồng vào (Input to System):**
  1. `DF-CG-IN-01: Danh mục Cây trồng & Quy chuẩn tương thích:` `{cropName, varietyName, soilSuitability[], expectedGrowthDays, bufferDays (7d)}`.
  2. `DF-CG-IN-02: Quy trình canh tác chuẩn (Template):` `{templateId, templateName, stageList[], defaultTasks[], version}`.
  3. `DF-CG-IN-03: Ngưỡng an toàn vi khí hậu IoT:` `{varietyId, minTemp, maxTemp, minSoilMoisture, maxSoilMoisture}`.
  4. `DF-CG-IN-04: Tri thức nông nghiệp chuẩn hóa:` `{knowledgeDocs[], pestGuidelines}` *(Làm dữ liệu Vector RAG)*.
  5. `DF-CG-IN-05: Kế hoạch canh tác chi tiết cho hợp đồng:` `{rentalId, customizedTasks[], plannedDates}`.
  6. `DF-CG-IN-06: Phác đồ xử lý sự cố sâu bệnh:` `{issueId, diagnosis, chemicalBiologicalSolution, actionSteps}`.

* **Luồng ra (Output from System):**
  1. `DF-CG-OUT-01: Danh sách yêu cầu tư vấn trước thuê:` `{consultationRequests[]}`.
  2. `DF-CG-OUT-02: Danh sách hợp đồng Assisted-growing chờ lập kế hoạch:` `{pendingRentalPlans[]}`.
  3. `DF-CG-OUT-03: Báo cáo sự cố thực địa (kèm ảnh hiện trường) từ CVLĐ:` `{issueId, plotNumber, fieldPhotos[], staffNote}`.
  4. `DF-CG-OUT-04: Cảnh báo vi khí hậu bất thường từ cảm biến IoT:` `{plotId, abnormalMetric, durationExceeded}`.
  5. `DF-CG-OUT-05: Yêu cầu hỗ trợ sâu bệnh từ Khách hàng:` `{customerId, cropType, leafPhotos[]}`.

### 4.3. Luồng dữ liệu giữa CHUYÊN VIÊN LAO ĐỘNG (CVLĐ) và Hệ thống
* **Luồng vào (Input to System):**
  1. `DF-LD-IN-01: Trạng thái bắt đầu ca / thực hiện task:` `{taskId, status: IN_PROGRESS, startTime}`.
  2. `DF-LD-IN-02: Báo cáo nghiệm thu hoàn thành task (BR15):` `{taskId, mandatoryEvidencePhotoUrl, materialUsageQuantity, completionNotes}` *(Bắt buộc ảnh mới cho đóng task)*.
  3. `DF-LD-IN-03: Báo cáo sự cố bất thường tại vườn:` `{plotId, issueType, description, immediatePhotos[]}`.
  4. `DF-LD-IN-04: Xác nhận sản lượng thu hoạch thực tế:` `{rentalId, actualWeightKg, wastePercentage}`.

* **Luồng ra (Output from System):**
  1. `DF-LD-OUT-01: Lịch công việc chăm sóc hôm nay (Care Tasks):` `{taskId, plotLocation, cropName, taskType, instructionStep, dueTime}`.
  2. `DF-LD-OUT-02: Sơ đồ vị trí thửa đất & Chỉ dẫn kỹ thuật:` `{plotCoordinates, standardOperationProcedure}`.
  3. `DF-LD-OUT-03: Chỉ đạo xử lý sự cố vườn từ Chuyên gia:` `{issueResolutionProtocol, safetySteps}`.

### 4.4. Luồng dữ liệu giữa QUẢN TRỊ VIÊN (ADMIN) và Hệ thống
* **Luồng vào (Input to System):**
  1. `DF-AD-IN-01: Cấu hình tài khoản & Phân quyền RBAC:` `{userId, role (KH/CGNN/CVLD/AD), isActive}`.
  2. `DF-AD-IN-02: Dữ liệu phân lô Thửa đất & Hạ tầng:` `{plotCode, landSector, areaSqm, waterSource, electricalStatus}`.
  3. `DF-AD-IN-03: Bảng giá thuê đất & Đơn giá dịch vụ phát sinh:` `{pricePerDay, assistedServiceRate, emergencyServiceRate}`.
  4. `DF-AD-IN-04: Lệnh điều phối phân công ca trực lao động:` `{staffId, shiftDate, assignedPlotList[]}`.
  5. `DF-AD-IN-05: Cấu hình thiết bị IoT & Tham số cảnh báo hệ thống:` `{gatewayId, sensorMapping[], slaThresholds}`.

* **Luồng ra (Output from System):**
  1. `DF-AD-OUT-01: Báo cáo tỷ lệ lấp đầy thửa đất (Occupancy Rate):` `{totalPlots, rentedPlots, fallowPlots, reservedLocks}`.
  2. `DF-AD-OUT-02: Báo cáo doanh thu & Dòng tiền thanh toán:` `{totalRentalIncome, serviceIncome, periodRevenue}`.
  3. `DF-AD-OUT-03: Báo cáo tiến độ hoàn thành Care Task của đội ngũ lao động:` `{tasksCompletedOnTime, tasksDelayed, missingEvidenceIncidents}`.
  4. `DF-AD-OUT-04: Nhật ký kiểm toán hệ thống (System Audit Log):` `{timestamp, actorId, actionName, entityAffected, ipAddress}`.
  5. `DF-AD-OUT-05: Cảnh báo vi phạm SLA (48h duyệt kế hoạch, quá hạn giữ chỗ):` `{slaAlerts[]}`.

### 4.5. Luồng dữ liệu với HỆ THỐNG NGOẠI VI (EXTERNAL SERVICES)
* **Cổng Thanh toán (Payment Gateway):**
  * `DF-PAY-REQ (Hệ thống ➔ Payment Gateway):` `{txnRef, amount100Percent, orderInfo, returnUrl, ipnUrl}`.
  * `DF-PAY-RESP (Payment Gateway ➔ Hệ thống):` `{txnRef, vnp_ResponseCode, bankTxnNo, paymentStatus (SUCCESS/FAILED)}`.
* **Hệ thống Cảm biến IoT (IoT Sensors):**
  * `DF-IOT-IN (Cảm biến ➔ Hệ thống):` `{deviceId, plotId, timestamp, airTempC, airHumidityPct, soilMoisturePct, luxLevel}`.
* **Dịch vụ AI (LLM Agricultural Assistant):**
  * `DF-AI-REQ (Hệ thống ➔ AI Service):` `{userQuery, systemPrompt, retrievedCropContextChunk[]}`.
  * `DF-AI-RESP (AI Service ➔ Hệ thống):` `{generatedAnswerMarkdown, confidenceScore}`.
* **Dịch vụ Dự báo Thời tiết (Weather Service):**
  * `DF-WEATHER-IN (Dịch vụ Thời tiết ➔ Hệ thống):` `{latitude, longitude, forecast7Days: [{tempMin, tempMax, rainfallProb, condition}]}`.

---

## 5. HƯỚNG DẪN BẢO VỆ VẤN ĐÁP TRƯỚC GIẢNG VIÊN (VIVA DEFENSE PLAYBOOK)

Dưới đây là **4 câu hỏi điển hình** giảng viên bộ môn ISAD/Software Architecture tại Đại học FPT thường đặt ra cho sinh viên khi chấm sơ đồ Context Diagram:

### ❓ Câu hỏi 1: "Tại sao trong sơ đồ Context Diagram của em không thấy bảng Database nào cả?"
* **Câu trả lời chuẩn:** *"Dạ thưa Thầy/Cô, theo đúng nguyên lý thiết kế DFD của Yourdon & Coad và Gane & Sarson, Context Diagram đại diện cho mức trừu tượng cao nhất (Mức 0) nơi toàn bộ hệ thống được xem như một Hộp đen (Black Box - Process 0). Mọi kho lưu trữ dữ liệu (Data Store) và bảng quan hệ logic đều nằm bên trong Process 0. Việc vẽ Data Store ở Context Diagram là vi phạm quy chuẩn thiết kế luồng dữ liệu, vì ở mức này ta chỉ tập trung xác lập ranh giới giao tiếp giữa hệ thống với các Tác nhân ngoài (External Entities)."*

### ❓ Câu hỏi 2: "Khách hàng muốn hỏi chuyên gia về sâu bệnh. Tại sao không nối mũi tên thẳng từ Khách hàng sang Chuyên gia?"
* **Câu trả lời chuẩn:** *"Dạ thưa Thầy/Cô, DFD mô tả dòng chảy thông tin trong một hệ thống phần mềm, không phải sơ đồ tổ chức nhân sự hay sơ đồ giao tiếp xã hội. Khách hàng không thể chat thẳng bằng suy nghĩ đến Chuyên gia; tin nhắn, hình ảnh lá bệnh bắt buộc phải được gửi vào Hệ thống (Process 0) để lưu trữ vào cơ sở dữ liệu, kiểm tra quyền hạn hợp đồng, gán ticket hỗ trợ và thông báo đến Chuyên gia. Do đó mọi luồng dữ liệu bắt buộc phải đi qua Process 0, không được nối trực tiếp giữa hai tác nhân ngoài."*

### ❓ Câu hỏi 3: "Cảm biến IoT và Cổng thanh toán là phần cứng/dịch vụ ngoài, sao lại được coi là External Entity giống như Khách hàng?"
* **Câu trả lời chuẩn:** *"Dạ thưa Thầy/Cô, trong ISAD, Tác nhân ngoài (External Entity / Terminator) được định nghĩa là bất kỳ thực thể nào nằm ngoài ranh giới kiểm soát của phần mềm mà ta đang xây dựng nhưng có hoạt động cung cấp dữ liệu đầu vào hoặc tiêu thụ dữ liệu đầu ra của hệ thống. Vì Cổng thanh toán (VNPay) và Trạm cảm biến IoT (Hardware) là các hệ thống độc lập, hoạt động tự chủ và giao tiếp với hệ thống của chúng em qua API/Webhook, nên theo chuẩn kỹ thuật chúng là các System External Entities hoàn toàn hợp lệ."*

### ❓ Câu hỏi 4: "Từ Context Diagram này, nhóm sẽ phân rã (Decompose) thành DFD Mức 1 như thế nào?"
* **Câu trả lời chuẩn:** *"Dạ thưa Thầy/Cô, từ Process 0 này, khi bước sang DFD Mức 1 (Level 1 Decomposition), nhóm phân rã thành 5 tiến trình nghiệp vụ cốt lõi tương ứng với 5 phân hệ Clean Architecture:
  * **Process 1.0:** Quản lý Sàn Marketplace, Giữ chỗ (15m Lock) & Thanh toán trọn gói.
  * **Process 2.0:** Quản lý Danh mục Giống cây, Chuẩn hóa & Duyệt Kế hoạch Canh tác (SLA 48h).
  * **Process 3.0:** Điều phối, Nghiệm thu Công việc Hiện trường (BR15) & Nhật ký Nông trại.
  * **Process 4.0:** Xử lý Chuỗi dữ liệu Cảm biến Vi khí hậu IoT & Trợ lý Tri thức AI.
  * **Process 5.0:** Quản trị Nền tảng, Phân lô Thửa đất & Báo cáo Doanh thu/Kiểm toán."*
