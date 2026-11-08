package com.smartagrirent.monitoring.dto.response;

import com.smartagrirent.monitoring.entity.SensorReading;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReadingResponse {

    private Long readingId;
    private Integer plotId;
    private Double temperature;
    private Double airHumidity;
    private Double soilHumidity;
    private Instant recordedAt;
    private String status;
    private String statusMessage;

    public static SensorReadingResponse fromEntity(SensorReading entity) {
        if (entity == null) {
            return null;
        }

        double temp = entity.getTemperature() != null ? entity.getTemperature().doubleValue() : 0.0;
        double airHum = entity.getAirHumidity() != null ? entity.getAirHumidity().doubleValue() : 0.0;
        double soilHum = entity.getSoilHumidity() != null ? entity.getSoilHumidity().doubleValue() : 0.0;

        String status = "OPTIMAL";
        String statusMessage = "Điều kiện vi khí hậu lý tưởng";

        if (soilHum < 45.0) {
            status = "WARNING_LOW_SOIL_MOISTURE";
            statusMessage = "Độ ẩm đất thấp, cần tưới nước kịp thời";
        } else if (soilHum > 80.0) {
            status = "WARNING_HIGH_SOIL_MOISTURE";
            statusMessage = "Độ ẩm đất cao (>80%), tạm ngưng tưới";
        } else if (temp > 35.0) {
            status = "WARNING_HIGH_TEMP";
            statusMessage = "Nhiệt độ môi trường cao, che chắn ánh nắng";
        }

        return SensorReadingResponse.builder()
                .readingId(entity.getReadingId())
                .plotId(entity.getPlotId())
                .temperature(temp)
                .airHumidity(airHum)
                .soilHumidity(soilHum)
                .recordedAt(entity.getRecordedAt())
                .status(status)
                .statusMessage(statusMessage)
                .build();
    }
}
