package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.response.CultivationDashboardResponse;
import com.farmely.cultivation.service.CultivationDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cultivation/dashboard")
@RequiredArgsConstructor
@Tag(name = "Cultivation Dashboard", description = "Số liệu Tổng quan Phân hệ Canh tác cho Khách hàng, Công nhân & Ban quản trị")
public class CultivationDashboardController {

    private final CultivationDashboardService cultivationDashboardService;

    @GetMapping
    @Operation(summary = "Lấy dữ liệu thống kê tổng quan canh tác", description = "Hỗ trợ lọc theo mã công nhân (workerId) để lấy số liệu ca trực của công nhân, hoặc xem toàn trang trại")
    public ResponseEntity<ApiResponse<CultivationDashboardResponse>> getDashboardStats(
            @RequestParam(required = false) Integer workerId,
            @RequestParam(required = false) Integer rentalId
    ) {
        CultivationDashboardResponse stats = cultivationDashboardService.getDashboardStats(workerId, rentalId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
