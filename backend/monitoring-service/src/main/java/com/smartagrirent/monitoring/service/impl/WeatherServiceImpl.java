package com.smartagrirent.monitoring.service.impl;

import com.smartagrirent.monitoring.dto.response.WeatherResponse;
import com.smartagrirent.monitoring.entity.SensorReading;
import com.smartagrirent.monitoring.repository.SensorReadingRepository;
import com.smartagrirent.monitoring.service.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherServiceImpl implements WeatherService {

    private final SensorReadingRepository readingRepository;

    @Override
    public WeatherResponse getCurrentWeather(Integer plotId) {
        int targetPlot = (plotId != null && plotId > 0) ? plotId : 1;

        Optional<SensorReading> latestReadingOpt = readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(targetPlot);
        BigDecimal currentTemp = new BigDecimal("29.50");
        BigDecimal currentHumidity = new BigDecimal("74.00");
        BigDecimal currentSoil = new BigDecimal("65.00");

        if (latestReadingOpt.isPresent()) {
            SensorReading r = latestReadingOpt.get();
            if (r.getTemperature() != null) currentTemp = r.getTemperature();
            if (r.getAirHumidity() != null) currentHumidity = r.getAirHumidity();
            if (r.getSoilHumidity() != null) currentSoil = r.getSoilHumidity();
        }

        // Mô phỏng dự báo mưa dựa theo độ ẩm không khí hoặc khung giờ chiều
        int rainProb = currentHumidity.doubleValue() > 80.0 ? 85 : (currentHumidity.doubleValue() > 70.0 ? 60 : 25);
        boolean postponeWatering = rainProb >= 70 || currentSoil.doubleValue() >= 80.0;

        String condition = rainProb >= 70 ? "Có mưa rào và dông rải rác" : (rainProb >= 40 ? "Nhiều mây, có nắng gián đoạn" : "Nắng ráo quang mây");
        String iconCode = rainProb >= 70 ? "RAIN" : (rainProb >= 40 ? "PARTLY_CLOUDY" : "SUNNY");

        String recMessage = postponeWatering
                ? "Khuyến nghị BR18: Xác suất mưa dông đạt " + rainProb + "% (hoặc độ ẩm đất đạt " + currentSoil + "%). Đề xuất tạm hoãn ca tưới nước để chống ngập úng rễ và tiết kiệm nước."
                : "Thời tiết thuận lợi cho canh tác nông nghiệp tự nhiên. Duy trì lịch tưới tiêu định kỳ.";

        return WeatherResponse.builder()
                .plotId(targetPlot)
                .plotCode("P-0" + targetPlot)
                .locationName("Trang trại Happy Valley Củ Chi, TP.HCM")
                .condition(condition)
                .iconCode(iconCode)
                .temperature(currentTemp)
                .humidity(currentHumidity)
                .rainfallProbability(rainProb)
                .windSpeed(new BigDecimal("12.50"))
                .wateringPostponementRecommended(postponeWatering)
                .recommendationMessage(recMessage)
                .forecastDays(generate5DayForecast())
                .build();
    }

    @Override
    public WeatherResponse getWeatherForecast(Integer plotId) {
        return getCurrentWeather(plotId);
    }

    @Override
    public Map<String, Object> getWateringPolicy(Integer plotId) {
        WeatherResponse weather = getCurrentWeather(plotId);
        Map<String, Object> policy = new HashMap<>();
        policy.put("plotId", weather.getPlotId());
        policy.put("plotCode", weather.getPlotCode());
        policy.put("postponeRecommended", weather.getWateringPostponementRecommended());
        policy.put("rainfallProbability", weather.getRainfallProbability());
        policy.put("policyRule", "BR18: Tạm hoãn tưới nếu độ ẩm đất >= 80% hoặc xác suất mưa >= 70%");
        policy.put("recommendationMessage", weather.getRecommendationMessage());
        return policy;
    }

    private List<WeatherResponse.DailyForecast> generate5DayForecast() {
        List<WeatherResponse.DailyForecast> list = new ArrayList<>();
        LocalDate today = LocalDate.now();

        String[] conditions = {"Nhiều mây, mưa dông chiều", "Nắng ráo, ít mây", "Nắng nhẹ, gió mát", "Có mưa rào cục bộ", "Nắng ráo quang đãng"};
        String[] icons = {"RAIN", "SUNNY", "PARTLY_CLOUDY", "RAIN", "SUNNY"};
        int[] rainProbs = {80, 20, 30, 75, 15};
        double[][] temps = {{26.0, 33.5}, {25.5, 35.0}, {26.0, 34.0}, {25.0, 32.5}, {25.5, 34.5}};

        for (int i = 0; i < 5; i++) {
            LocalDate d = today.plusDays(i);
            String dayName = (i == 0) ? "Hôm nay" : d.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("vi-VN"));

            list.add(WeatherResponse.DailyForecast.builder()
                    .date(d.toString())
                    .dayOfWeek(dayName)
                    .condition(conditions[i])
                    .iconCode(icons[i])
                    .minTemp(BigDecimal.valueOf(temps[i][0]))
                    .maxTemp(BigDecimal.valueOf(temps[i][1]))
                    .rainProb(rainProbs[i])
                    .build());
        }
        return list;
    }
}
