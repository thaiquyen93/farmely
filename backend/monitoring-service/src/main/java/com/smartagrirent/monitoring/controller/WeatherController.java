package com.smartagrirent.monitoring.controller;

import com.smartagrirent.monitoring.dto.response.WeatherResponse;
import com.smartagrirent.monitoring.service.WeatherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Weather & Microclimate API", description = "Dự báo thời tiết OpenWeatherMap & Kiểm soát hoãn tưới tự động (BR18 / Non-Screen #13, #15)")
@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @Operation(summary = "Lấy dữ liệu thời tiết hiện tại & kiểm tra khuyến nghị hoãn tưới BR18")
    @GetMapping("/current")
    public ResponseEntity<WeatherResponse> getCurrentWeather(
            @RequestParam(defaultValue = "1") @Parameter(description = "ID thửa đất") Integer plotId
    ) {
        return ResponseEntity.ok(weatherService.getCurrentWeather(plotId));
    }

    @Operation(summary = "Lấy dự báo thời tiết 5 ngày tới cho nông trại")
    @GetMapping("/forecast")
    public ResponseEntity<WeatherResponse> getWeatherForecast(
            @RequestParam(defaultValue = "1") @Parameter(description = "ID thửa đất") Integer plotId
    ) {
        return ResponseEntity.ok(weatherService.getWeatherForecast(plotId));
    }

    @Operation(summary = "Lấy trạng thái chính sách điều tiết tưới tiêu theo thời tiết (BR18)")
    @GetMapping("/policy")
    public ResponseEntity<Map<String, Object>> getWateringPolicy(
            @RequestParam(defaultValue = "1") @Parameter(description = "ID thửa đất") Integer plotId
    ) {
        return ResponseEntity.ok(weatherService.getWateringPolicy(plotId));
    }
}
