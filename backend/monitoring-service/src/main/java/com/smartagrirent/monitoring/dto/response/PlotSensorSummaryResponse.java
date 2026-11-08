package com.smartagrirent.monitoring.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotSensorSummaryResponse {
    private Integer plotId;
    private SensorReadingResponse latestReading;
    private Double avgTemperature;
    private Double avgAirHumidity;
    private Double avgSoilHumidity;
    private Integer totalReadings24h;
}
