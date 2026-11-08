package com.smartagrirent.monitoring.dto.response;

import com.smartagrirent.monitoring.entity.Alert;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertResponse {

    private Long alertId;
    private String alertCode; // e.g. ALT-101
    private Integer plotId;
    private String plotCode; // e.g. P-01
    private String alertType;
    private String severity;
    private String status;
    private String metricName;
    private BigDecimal actualValue;
    private BigDecimal thresholdValue;
    private String message;
    private String actionSuggested;
    private Instant detectedAt;
    private Instant resolvedAt;
    private String resolvedBy;
    private String resolutionNotes;

    public static AlertResponse fromEntity(Alert entity) {
        if (entity == null) return null;
        return AlertResponse.builder()
                .alertId(entity.getAlertId())
                .alertCode("ALT-" + entity.getAlertId())
                .plotId(entity.getPlotId())
                .plotCode("P-0" + entity.getPlotId())
                .alertType(entity.getAlertType())
                .severity(entity.getSeverity())
                .status(entity.getStatus())
                .metricName(entity.getMetricName())
                .actualValue(entity.getActualValue())
                .thresholdValue(entity.getThresholdValue())
                .message(entity.getMessage())
                .actionSuggested(entity.getActionSuggested())
                .detectedAt(entity.getDetectedAt())
                .resolvedAt(entity.getResolvedAt())
                .resolvedBy(entity.getResolvedBy())
                .resolutionNotes(entity.getResolutionNotes())
                .build();
    }
}
