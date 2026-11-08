package com.smartagrirent.monitoring.controller;

import com.smartagrirent.monitoring.dto.request.CreateAlertRequest;
import com.smartagrirent.monitoring.dto.response.AlertResponse;
import com.smartagrirent.monitoring.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "IoT Alerts API", description = "Quản lý cảnh báo vượt ngưỡng vi khí hậu IoT & phát hiện bất thường hiện trường (BR18 / UC13 / SCR-AD-08)")
@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @Operation(summary = "Lấy danh sách cảnh báo vi khí hậu IoT", description = "Lọc theo thửa đất (plotId), trạng thái (ACTIVE, ACKNOWLEDGED, RESOLVED), mức độ (WARNING, CRITICAL, EMERGENCY)")
    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts(
            @RequestParam(required = false) @Parameter(description = "Mã thửa đất") Integer plotId,
            @RequestParam(required = false) @Parameter(description = "Trạng thái (ACTIVE, ACKNOWLEDGED, RESOLVED)") String status,
            @RequestParam(required = false) @Parameter(description = "Mức độ nghiêm trọng") String severity
    ) {
        return ResponseEntity.ok(alertService.getAlerts(plotId, status, severity));
    }

    @Operation(summary = "Lấy số liệu tổng hợp cảnh báo & trạng thái trạm IoT (Admin Dashboard)")
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getAlertOverview() {
        return ResponseEntity.ok(alertService.getAlertOverview());
    }

    @Operation(summary = "Tiếp nhận cảnh báo (Acknowledge) bởi Chuyên gia hoặc Quản trị viên")
    @PutMapping("/{id}/ack")
    public ResponseEntity<AlertResponse> acknowledgeAlert(
            @PathVariable("id") Long id,
            @RequestParam(required = false) String acknowledgedBy
    ) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id, acknowledgedBy));
    }

    @Operation(summary = "Đánh dấu đã xử lý hoàn tất cảnh báo vi khí hậu (Resolve)")
    @PutMapping("/{id}/resolve")
    public ResponseEntity<AlertResponse> resolveAlert(
            @PathVariable("id") Long id,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String resolvedBy
    ) {
        return ResponseEntity.ok(alertService.resolveAlert(id, notes, resolvedBy));
    }

    @Operation(summary = "Tạo cảnh báo mới thủ công")
    @PostMapping
    public ResponseEntity<AlertResponse> createAlert(@Valid @RequestBody CreateAlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.createAlert(request));
    }

    @Operation(summary = "Kích hoạt giả lập cảnh báo vi khí hậu bất thường (Test / Demo BR18)")
    @PostMapping("/simulate")
    public ResponseEntity<AlertResponse> simulateAnomalyAlert(
            @RequestParam(defaultValue = "1") Integer plotId,
            @RequestParam(defaultValue = "HIGH_TEMPERATURE") String anomalyType
    ) {
        return ResponseEntity.ok(alertService.simulateAnomalyAlert(plotId, anomalyType));
    }
}
