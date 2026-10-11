package com.farmely.rental.controller;

import com.farmely.rental.dto.common.ApiResponse;
import com.farmely.rental.dto.request.BookSiteVisitRequest;
import com.farmely.rental.dto.response.SiteVisitResponse;
import com.farmely.rental.entity.VisitStatus;
import com.farmely.rental.service.SiteVisitService;
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
@Tag(name = "Site Visits", description = "Quản lý Lịch hẹn tham quan nông trại trước khi thuê (BR06)")
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    @PostMapping
    @Operation(summary = "Khách hàng đăng ký lịch tham quan trang trại (BR06)")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> bookSiteVisit(
            @Valid @RequestBody BookSiteVisitRequest request) {
        SiteVisitResponse response = siteVisitService.bookSiteVisit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký lịch tham quan thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các lịch hẹn tham quan trang trại")
    public ResponseEntity<ApiResponse<List<SiteVisitResponse>>> getAllSiteVisits(
            @RequestParam(required = false) Integer plotId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate,
            @RequestParam(required = false) VisitStatus status) {
        List<SiteVisitResponse> list = siteVisitService.getAllSiteVisits(plotId, visitDate, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một lịch hẹn tham quan theo ID")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> getSiteVisitById(
            @PathVariable Integer id) {
        SiteVisitResponse response = siteVisitService.getSiteVisitById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận lịch hẹn tham quan trang trại")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> confirmSiteVisit(
            @PathVariable Integer id) {
        SiteVisitResponse response = siteVisitService.confirmSiteVisit(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Xác nhận lịch tham quan thành công"));
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Đánh dấu đã hoàn thành buổi tham quan trang trại")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> completeSiteVisit(
            @PathVariable Integer id) {
        SiteVisitResponse response = siteVisitService.completeSiteVisit(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hoàn thành buổi tham quan"));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Hủy lịch hẹn tham quan trang trại")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> cancelSiteVisit(
            @PathVariable Integer id) {
        SiteVisitResponse response = siteVisitService.cancelSiteVisit(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy lịch tham quan thành công"));
    }
}
