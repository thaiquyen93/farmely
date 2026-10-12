package com.smartagrirent.farm.controller;

import com.smartagrirent.farm.dto.request.CreateLandRequest;
import com.smartagrirent.farm.dto.response.ApiResponse;
import com.smartagrirent.farm.dto.response.LandResponse;
import com.smartagrirent.farm.service.LandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lands")
@RequiredArgsConstructor
@Tag(name = "Land Management API", description = "Quản lý khu đất và nông trại Farmely")
public class LandController {

    private final LandService landService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các khu đất / trang trại")
    public ResponseEntity<ApiResponse<List<LandResponse>>> getAllLands() {
        List<LandResponse> list = landService.getAllLands();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu đất thành công", list));
    }

    @GetMapping("/{landId}")
    @Operation(summary = "Lấy thông tin chi tiết khu đất theo ID")
    public ResponseEntity<ApiResponse<LandResponse>> getLandById(@PathVariable Integer landId) {
        LandResponse response = landService.getLandById(landId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khu đất thành công", response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới khu đất / nông trại (Dành cho Admin)")
    public ResponseEntity<ApiResponse<LandResponse>> createLand(@Valid @RequestBody CreateLandRequest request) {
        LandResponse response = landService.createLand(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khu đất mới thành công", response));
    }
}
