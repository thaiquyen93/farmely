package com.smartagrirent.monitoring.controller;

import com.smartagrirent.monitoring.dto.response.PlotSensorSummaryResponse;
import com.smartagrirent.monitoring.dto.response.SensorReadingResponse;
import com.smartagrirent.monitoring.service.SensorSimulationService;
import com.smartagrirent.monitoring.service.SensorSseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@Tag(name = "Sensor Telemetry API", description = "APIs for IoT microclimate sensor readings, history, and real-time SSE stream")
@RestController
@RequestMapping("/api/sensors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SensorController {

    private final SensorSimulationService simulationService;
    private final SensorSseService sseService;

    @Operation(summary = "Lấy dữ liệu cảm biến mới nhất của thửa đất")
    @GetMapping("/plots/{plotId}/latest")
    public ResponseEntity<SensorReadingResponse> getLatestReading(
            @PathVariable @Parameter(description = "ID thửa đất") Integer plotId) {
        return ResponseEntity.ok(simulationService.getLatestReading(plotId));
    }

    @Operation(summary = "Lấy lịch sử dữ liệu cảm biến trong N giờ qua để vẽ biểu đồ")
    @GetMapping("/plots/{plotId}/history")
    public ResponseEntity<List<SensorReadingResponse>> getReadingHistory(
            @PathVariable @Parameter(description = "ID thửa đất") Integer plotId,
            @RequestParam(defaultValue = "24") @Parameter(description = "Số giờ lịch sử (mặc định 24)") int hours) {
        return ResponseEntity.ok(simulationService.getReadingHistory(plotId, hours));
    }

    @Operation(summary = "Lấy tổng hợp chỉ số trung bình 24h & trạng thái cảnh báo")
    @GetMapping("/plots/{plotId}/summary")
    public ResponseEntity<PlotSensorSummaryResponse> getPlotSummary(
            @PathVariable @Parameter(description = "ID thửa đất") Integer plotId) {
        return ResponseEntity.ok(simulationService.getPlotSummary(plotId));
    }

    @Operation(summary = "Đăng ký nhận luồng dữ liệu cảm biến thời gian thực (SSE Stream) cho một thửa đất")
    @GetMapping(value = "/plots/{plotId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPlotReadings(
            @PathVariable @Parameter(description = "ID thửa đất") Integer plotId) {
        SensorReadingResponse initial = simulationService.getLatestReading(plotId);
        return sseService.subscribe(plotId, initial);
    }

    @Operation(summary = "Đăng ký nhận luồng dữ liệu cảm biến thời gian thực cho toàn bộ nông trại (Admin)")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAllReadings() {
        return sseService.subscribe(0, null);
    }

    @Operation(summary = "Kích hoạt sinh ngay 1 điểm dữ liệu ngẫu nhiên (dùng khi Demo/Test)")
    @PostMapping("/mock/generate")
    public ResponseEntity<SensorReadingResponse> triggerManualReading(
            @RequestParam(defaultValue = "1") Integer plotId) {
        return ResponseEntity.ok(simulationService.triggerManualMock(plotId));
    }

    @Operation(summary = "Tự động sinh lại dữ liệu mẫu lịch sử 24h cho một thửa đất")
    @PostMapping("/mock/seed")
    public ResponseEntity<Map<String, Object>> seedHistory(
            @RequestParam(defaultValue = "1") Integer plotId,
            @RequestParam(defaultValue = "24") int hours) {
        simulationService.seedHistoryForPlot(plotId, hours);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Successfully seeded " + hours + " hours of sensor data for plot " + plotId
        ));
    }
}
