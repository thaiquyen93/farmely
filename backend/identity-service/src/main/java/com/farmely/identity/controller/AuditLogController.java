package com.farmely.identity.controller;

import com.farmely.identity.dto.ApiResponse;
import com.farmely.identity.dto.AuditLogResponse;
import com.farmely.identity.dto.CreateAuditLogRequest;
import com.farmely.identity.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "APIs truy vấn và ghi nhận nhật ký hoạt động toàn hệ thống")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách nhật ký hệ thống", description = "Chỉ Admin được phép xem nhật ký hoạt động")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogResponse> logs = auditLogService.getLogs(action, entityType, userEmail, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thống kê tổng quan nhật ký hệ thống", description = "Thống kê số lượng đăng nhập, đổi trạng thái và tác vụ hôm nay")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        Map<String, Object> overview = auditLogService.getAuditOverview();
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @PostMapping
    @Operation(summary = "Ghi nhận nhật ký hoạt động mới", description = "Dành cho các microservices hoặc tác vụ nội bộ ghi log")
    public ResponseEntity<ApiResponse<Void>> createLog(
            @Valid @RequestBody CreateAuditLogRequest request,
            HttpServletRequest servletRequest
    ) {
        if (request.getIpAddress() == null || request.getIpAddress().isBlank()) {
            request.setIpAddress(servletRequest.getRemoteAddr());
        }
        auditLogService.log(request);
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận nhật ký thành công", null));
    }
}
