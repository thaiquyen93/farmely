package com.smartagrirent.monitoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sensor_readings", indexes = {
        @Index(name = "idx_sensor_plot_id", columnList = "plot_id"),
        @Index(name = "idx_sensor_recorded_at", columnList = "recorded_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reading_id")
    private Long readingId;

    @Column(name = "plot_id", nullable = false)
    private Integer plotId;

    @Column(name = "temperature", precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(name = "air_humidity", precision = 5, scale = 2)
    private BigDecimal airHumidity;

    @Column(name = "soil_humidity", precision = 5, scale = 2)
    private BigDecimal soilHumidity;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private Instant recordedAt = Instant.now();
}
