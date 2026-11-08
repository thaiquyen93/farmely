package com.smartagrirent.monitoring.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherResponse {

    private Integer plotId;
    private String plotCode;
    private String locationName; // "Củ Chi Eco Farm, TP.HCM"
    private String condition;
    private String iconCode; // SUNNY, PARTLY_CLOUDY, RAIN, THUNDERSTORM
    private BigDecimal temperature;
    private BigDecimal humidity;
    private Integer rainfallProbability;
    private BigDecimal windSpeed;
    private Boolean wateringPostponementRecommended;
    private String recommendationMessage;
    private List<DailyForecast> forecastDays;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyForecast {
        private String date; // YYYY-MM-DD
        private String dayOfWeek; // Thứ Hai, Thứ Ba...
        private String condition;
        private String iconCode;
        private BigDecimal minTemp;
        private BigDecimal maxTemp;
        private Integer rainProb;
    }
}
