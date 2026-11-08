package com.smartagrirent.monitoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "iot_alerts", indexes = {
        @Index(name = "idx_alert_plot_id", columnList = "plot_id"),
        @Index(name = "idx_alert_status", columnList = "status"),
        @Index(name = "idx_alert_detected_at", columnList = "detected_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @Column(name = "plot_id", nullable = false)
    private Integer plotId;

    @Column(name = "alert_type", length = 60, nullable = false)
    private String alertType; // HIGH_TEMPERATURE, LOW_SOIL_MOISTURE, HIGH_AIR_HUMIDITY, SENSOR_ANOMALY

    @Column(name = "severity", length = 30, nullable = false)
    @Builder.Default
    private String severity = "WARNING"; // INFO, WARNING, CRITICAL, EMERGENCY

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ACKNOWLEDGED, RESOLVED

    @Column(name = "metric_name", length = 100)
    private String metricName;

    @Column(name = "actual_value", precision = 6, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "threshold_value", precision = 6, scale = 2)
    private BigDecimal thresholdValue;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "action_suggested", columnDefinition = "TEXT")
    private String actionSuggested;

    @Column(name = "detected_at", nullable = false)
    @Builder.Default
    private Instant detectedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
}
