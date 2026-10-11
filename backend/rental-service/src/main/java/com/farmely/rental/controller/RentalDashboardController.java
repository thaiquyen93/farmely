package com.farmely.rental.controller;

import com.farmely.rental.dto.common.ApiResponse;
import com.farmely.rental.dto.response.RentalDashboardResponse;
import com.farmely.rental.service.RentalDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rentals/dashboard")
@RequiredArgsConstructor
@Tag(name = "Rental Dashboard", description = "Báo cáo thống kê chỉ số cho Admin & Vận hành")
public class RentalDashboardController {

    private final RentalDashboardService dashboardService;

    @GetMapping("/overview")
    @Operation(summary = "Lấy các chỉ số thống kê hợp đồng, lượt thuê, doanh thu, hủy & thăm quan")
    public ResponseEntity<ApiResponse<RentalDashboardResponse>> getOverviewStats() {
        RentalDashboardResponse response = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
