package com.smartagrirent.farm.controller;

import com.smartagrirent.farm.dto.request.CreateSiteVisitRequest;
import com.smartagrirent.farm.dto.response.ApiResponse;
import com.smartagrirent.farm.dto.response.SiteVisitResponse;
import com.smartagrirent.farm.service.SiteVisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/site-visits")
@Tag(name = "Site Visit API", description = "Quản lý đặt lịch tham quan khảo sát thửa đất (SCR-PUB-05 / Table site_visits)")
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    @Autowired
    public SiteVisitController(SiteVisitService siteVisitService) {
        this.siteVisitService = siteVisitService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả lịch hẹn tham quan")
    public ResponseEntity<ApiResponse<List<SiteVisitResponse>>> getAllVisits() {
        List<SiteVisitResponse> list = siteVisitService.getAllSiteVisits();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch tham quan thành công", list));
    }

    @PostMapping
    @Operation(summary = "Tạo mới lịch hẹn khảo sát thực địa thửa đất")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> createVisit(@RequestBody CreateSiteVisitRequest request) {
        SiteVisitResponse created = siteVisitService.createSiteVisit(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lịch tham quan thành công", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một lịch hẹn tham quan")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> getVisitById(@PathVariable Integer id) {
        SiteVisitResponse visit = siteVisitService.getSiteVisitById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin lịch hẹn thành công", visit));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Admin xác nhận lịch đón tiếp tham quan")
    public ResponseEntity<ApiResponse<SiteVisitResponse>> confirmVisit(@PathVariable Integer id) {
        SiteVisitResponse confirmed = siteVisitService.confirmSiteVisit(id);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận đón tiếp thành công", confirmed));
    }
}
