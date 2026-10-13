package com.farmely.farm.controller;

import com.farmely.farm.constant.VisitStatus;
import com.farmely.farm.dto.ApiResponse;
import com.farmely.farm.dto.SiteVisitCreateRequest;
import com.farmely.farm.dto.SiteVisitResponse;
import com.farmely.farm.dto.SiteVisitStatusUpdateRequest;
import com.farmely.farm.service.SiteVisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/site-visits")
@RequiredArgsConstructor
@Tag(name = "Site Visit Management", description = "Quản lý đặt lịch khảo sát & thăm quan thực địa tại trang trại (SRS UC03, BR06)")
@CrossOrigin(origins = "*")
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    @PostMapping
    @Operation(summary = "Đặt lịch thăm quan thực địa (SRS UC03, SCR-KH-03)",
               description = "Khách hàng hoặc khách vãng lai đặt lịch hẹn trước ít nhất 24h (V3.2) theo khung giờ sáng/chiều")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> createSiteVisit(
            @Valid @RequestBody SiteVisitCreateRequest request) {
        SiteVisitResponse created = siteVisitService.createSiteVisit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký lịch tham quan thành công! Nhân viên Farmely sẽ liên hệ xác nhận trong thời gian sớm nhất.", created));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các lịch hẹn thăm quan",
               description = "Hỗ trợ lọc theo thửa đất, ngày hẹn, trạng thái và số điện thoại liên hệ")
    public ResponseEntity<ApiResponse<List<SiteVisitResponse>>> getAllSiteVisits(
            @RequestParam(required = false) Integer plotId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate,
            @RequestParam(required = false) VisitStatus status,
            @RequestParam(required = false) String phone) {
        List<SiteVisitResponse> visits = siteVisitService.getAllSiteVisits(plotId, visitDate, status, phone);
        return ResponseEntity.ok(ApiResponse.success(visits));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết lịch hẹn thăm quan theo ID", description = "Lấy thông tin chi tiết của một lịch hẹn")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> getSiteVisitById(@PathVariable("id") Integer id) {
        SiteVisitResponse visit = siteVisitService.getSiteVisitById(id);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái lịch hẹn thăm quan",
               description = "Chuyển trạng thái giữa PENDING, CONFIRMED, COMPLETED, CANCELLED")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> updateSiteVisitStatus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody SiteVisitStatusUpdateRequest request) {
        SiteVisitResponse updated = siteVisitService.updateSiteVisitStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái lịch hẹn thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hủy / Xóa lịch hẹn thăm quan", description = "Xóa bản ghi lịch hẹn thăm quan")
    public ResponseEntity<ApiResponse<Void>> deleteSiteVisit(@PathVariable("id") Integer id) {
        siteVisitService.deleteSiteVisit(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lịch hẹn thăm quan thành công", null));
    }
}
