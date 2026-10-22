package com.smartagrirent.monitoring.service.impl;

import com.smartagrirent.monitoring.dto.request.CreateAlertRequest;
import com.smartagrirent.monitoring.dto.response.AlertResponse;
import com.smartagrirent.monitoring.entity.Alert;
import com.smartagrirent.monitoring.entity.SensorReading;
import com.smartagrirent.monitoring.repository.AlertRepository;
import com.smartagrirent.monitoring.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void seedInitialAlertsIfEmpty() {
        try {
            if (alertRepository.count() == 0) {
                log.info("Seeding initial IoT microclimate alerts for demonstration...");
                Alert alert1 = Alert.builder()
                        .plotId(1)
                        .alertType("HIGH_TEMPERATURE")
                        .severity("CRITICAL")
                        .status("ACTIVE")
                        .metricName("Nhiệt độ không khí")
                        .actualValue(new BigDecimal("36.80"))
                        .thresholdValue(new BigDecimal("35.00"))
                        .message("Nhiệt độ thửa đất P-01 vượt ngưỡng 35.0°C. Nguy cơ sốc nhiệt và héo lá rau xà lách.")
                        .actionSuggested("Kích hoạt phun sương làm mát tự động và kéo lưới che tán xạ nhiệt.")
                        .detectedAt(Instant.now().minus(25, ChronoUnit.MINUTES))
                        .build();

                Alert alert2 = Alert.builder()
                        .plotId(2)
                        .alertType("LOW_SOIL_MOISTURE")
                        .severity("WARNING")
                        .status("ACTIVE")
                        .metricName("Độ ẩm đất")
                        .actualValue(new BigDecimal("36.50"))
                        .thresholdValue(new BigDecimal("40.00"))
                        .message("Độ ẩm đất thửa P-02 giảm sâu dưới 40.0%. Đất có dấu hiệu khô kiệt cục bộ.")
                        .actionSuggested("Bổ sung chu kỳ tưới nhỏ giọt 15 phút vào 15:30 chiều nay.")
                        .detectedAt(Instant.now().minus(50, ChronoUnit.MINUTES))
                        .build();

                Alert alert3 = Alert.builder()
                        .plotId(3)
                        .alertType("HIGH_AIR_HUMIDITY")
                        .severity("WARNING")
                        .status("RESOLVED")
                        .metricName("Độ ẩm không khí")
                        .actualValue(new BigDecimal("92.00"))
                        .thresholdValue(new BigDecimal("85.00"))
                        .message("Độ ẩm không khí thửa P-03 tăng cao sau cơn mưa rào lớn.")
                        .actionSuggested("Tăng cường thông gió nhà màng để ngăn ngừa nấm mốc phấn trắng.")
                        .detectedAt(Instant.now().minus(4, ChronoUnit.HOURS))
                        .resolvedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                        .resolvedBy("Ban Quản Trị Farmely")
                        .resolutionNotes("Đã bật quạt hút thông gió nhà màng P-03, độ ẩm trở lại 75%.")
                        .build();

                alertRepository.saveAll(List.of(alert1, alert2, alert3));
            }
        } catch (Exception e) {
            log.warn("Could not seed initial alerts: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getAlerts(Integer plotId, String status, String severity) {
        List<Alert> list;
        if (plotId != null) {
            list = alertRepository.findByPlotIdOrderByDetectedAtDesc(plotId);
        } else if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = alertRepository.findByStatusOrderByDetectedAtDesc(status.toUpperCase());
        } else if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
            list = alertRepository.findBySeverityOrderByDetectedAtDesc(severity.toUpperCase());
        } else {
            list = alertRepository.findAllByOrderByDetectedAtDesc();
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status) && plotId != null) {
            list = list.stream().filter(a -> a.getStatus().equalsIgnoreCase(status)).toList();
        }

        return list.stream().map(AlertResponse::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAlertOverview() {
        long total = alertRepository.count();
        long active = alertRepository.countByStatus("ACTIVE");
        long critical = alertRepository.countBySeverityAndStatus("CRITICAL", "ACTIVE");
        long acknowledged = alertRepository.countByStatus("ACKNOWLEDGED");
        long resolved = alertRepository.countByStatus("RESOLVED");

        Map<String, Object> map = new HashMap<>();
        map.put("totalAlerts", total);
        map.put("activeAlerts", active);
        map.put("criticalAlerts", critical);
        map.put("acknowledgedAlerts", acknowledged);
        map.put("resolvedAlerts", resolved);
        map.put("stationsOnline", 16);
        map.put("rainWateringOverrideActive", false);
        return map;
    }

    @Override
    @Transactional
    public AlertResponse acknowledgeAlert(Long alertId, String acknowledgedBy) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cảnh báo với mã: " + alertId));

        alert.setStatus("ACKNOWLEDGED");
        if (acknowledgedBy != null && !acknowledgedBy.isBlank()) {
            alert.setResolvedBy(acknowledgedBy);
        }
        Alert saved = alertRepository.save(alert);
        return AlertResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AlertResponse resolveAlert(Long alertId, String resolutionNotes, String resolvedBy) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cảnh báo với mã: " + alertId));

        alert.setStatus("RESOLVED");
        alert.setResolvedAt(Instant.now());
        alert.setResolvedBy(resolvedBy != null ? resolvedBy : "Quản trị viên Farmely");
        alert.setResolutionNotes(resolutionNotes != null ? resolutionNotes : "Cảnh báo vi khí hậu đã được kiểm tra và xử lý ổn định.");

        Alert saved = alertRepository.save(alert);
        return AlertResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AlertResponse createAlert(CreateAlertRequest request) {
        Alert alert = Alert.builder()
                .plotId(request.getPlotId())
                .alertType(request.getAlertType())
                .severity(request.getSeverity() != null ? request.getSeverity().toUpperCase() : "WARNING")
                .status("ACTIVE")
                .metricName(request.getMetricName() != null ? request.getMetricName() : "Chỉ số môi trường")
                .actualValue(request.getActualValue())
                .thresholdValue(request.getThresholdValue())
                .message(request.getMessage())
                .actionSuggested(request.getActionSuggested())
                .detectedAt(Instant.now())
                .build();

        Alert saved = alertRepository.save(alert);
        return AlertResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void evaluateThresholds(SensorReading reading) {
        if (reading == null || reading.getPlotId() == null) return;

        Integer plotId = reading.getPlotId();

        // 1. Kiểm tra bất thường cảm biến (Anomaly check BR16/BR18)
        if (reading.getTemperature() != null) {
            double temp = reading.getTemperature().doubleValue();
            if (temp < 0.0 || temp > 50.0) {
                triggerOrUpdateAlert(plotId, "SENSOR_ANOMALY", "EMERGENCY", "Nhiệt độ cảm biến",
                        reading.getTemperature(), new BigDecimal("45.00"),
                        String.format("Dữ liệu cảm biến trạm P-%02d bất thường: %.1f°C nằm ngoài biên đo sinh học chuẩn (0°C - 50°C).", plotId, temp),
                        "Cử chuyên viên kỹ thuật kiểm tra trạm cảm biến IoT và kết nối đầu dò.");
                return;
            }

            // 2. Nhiệt độ cao vượt ngưỡng (> 35.5°C)
            if (temp > 35.5) {
                triggerOrUpdateAlert(plotId, "HIGH_TEMPERATURE", "CRITICAL", "Nhiệt độ không khí",
                        reading.getTemperature(), new BigDecimal("35.00"),
                        String.format("Nhiệt độ tại thửa P-%02d đang ở mức %.1f°C, vượt ngưỡng an toàn thực vật.", plotId, temp),
                        "Bật hệ thống tưới phun sương làm mát và kéo rèm cản nhiệt.");
            }
        }

        // 3. Độ ẩm đất giảm sâu (< 38.0%)
        if (reading.getSoilHumidity() != null) {
            double soil = reading.getSoilHumidity().doubleValue();
            if (soil < 38.0) {
                triggerOrUpdateAlert(plotId, "LOW_SOIL_MOISTURE", "WARNING", "Độ ẩm đất",
                        reading.getSoilHumidity(), new BigDecimal("40.00"),
                        String.format("Độ ẩm đất thửa P-%02d xuống thấp (%.1f%%), cây trồng có nguy cơ thiếu nước tầng rễ.", plotId, soil),
                        "Kích hoạt chu kỳ tưới nhỏ giọt tự động bù ẩm theo quy trình kỹ thuật.");
            }
        }

        // 4. Độ ẩm không khí bão hòa quá cao (> 92.0%)
        if (reading.getAirHumidity() != null) {
            double air = reading.getAirHumidity().doubleValue();
            if (air > 92.0) {
                triggerOrUpdateAlert(plotId, "HIGH_AIR_HUMIDITY", "WARNING", "Độ ẩm không khí",
                        reading.getAirHumidity(), new BigDecimal("85.00"),
                        String.format("Độ ẩm không khí thửa P-%02d đạt %.1f%%, độ ẩm bão hòa kéo dài dễ sinh bệnh nấm lá.", plotId, air),
                        "Bật hệ thống quạt thông gió nhà màng để giảm ẩm lưu thông khí.");
            }
        }
    }

    private void triggerOrUpdateAlert(Integer plotId, String alertType, String severity, String metricName,
                                      BigDecimal actualVal, BigDecimal thresholdVal, String message, String action) {
        Optional<Alert> existingOpt = alertRepository.findFirstByPlotIdAndAlertTypeAndStatus(plotId, alertType, "ACTIVE");
        if (existingOpt.isPresent()) {
            Alert existing = existingOpt.get();
            existing.setActualValue(actualVal);
            alertRepository.save(existing);
        } else {
            Alert alert = Alert.builder()
                    .plotId(plotId)
                    .alertType(alertType)
                    .severity(severity)
                    .status("ACTIVE")
                    .metricName(metricName)
                    .actualValue(actualVal)
                    .thresholdValue(thresholdVal)
                    .message(message)
                    .actionSuggested(action)
                    .detectedAt(Instant.now())
                    .build();
            alertRepository.save(alert);
            log.info("Triggered IoT Alert [{} - {}] for plotId: {}", severity, alertType, plotId);
        }
    }

    @Override
    @Transactional
    public AlertResponse simulateAnomalyAlert(Integer plotId, String anomalyType) {
        int targetPlot = plotId != null ? plotId : 1;
        String type = (anomalyType != null && !anomalyType.isBlank()) ? anomalyType.toUpperCase() : "HIGH_TEMPERATURE";

        Alert alert;
        if ("LOW_SOIL_MOISTURE".equals(type)) {
            alert = Alert.builder()
                    .plotId(targetPlot)
                    .alertType("LOW_SOIL_MOISTURE")
                    .severity("CRITICAL")
                    .status("ACTIVE")
                    .metricName("Độ ẩm đất")
                    .actualValue(new BigDecimal("28.40"))
                    .thresholdValue(new BigDecimal("40.00"))
                    .message(String.format("CẢNH BÁO KHẨN CẤP: Độ ẩm đất thửa P-%02d giảm cực hạn (28.4%%). Khô hạn tầng rễ.", targetPlot))
                    .actionSuggested("Kích hoạt tưới khẩn cấp ngay lập tức.")
                    .detectedAt(Instant.now())
                    .build();
        } else {
            alert = Alert.builder()
                    .plotId(targetPlot)
                    .alertType("HIGH_TEMPERATURE")
                    .severity("CRITICAL")
                    .status("ACTIVE")
                    .metricName("Nhiệt độ không khí")
                    .actualValue(new BigDecimal("39.20"))
                    .thresholdValue(new BigDecimal("35.00"))
                    .message(String.format("CẢNH BÁO KHẨN CẤP: Nhiệt độ thửa P-%02d đạt 39.2°C, vượt ngưỡng giới hạn thực vật.", targetPlot))
                    .actionSuggested("Bật phun sương làm mát và hệ thống quạt thông gió cưỡng bức.")
                    .detectedAt(Instant.now())
                    .build();
        }

        Alert saved = alertRepository.save(alert);
        return AlertResponse.fromEntity(saved);
    }
}
