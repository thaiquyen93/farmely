package com.farmely.farm.controller;

import com.farmely.farm.dto.ApiResponse;
import com.farmely.farm.dto.LandDetailResponse;
import com.farmely.farm.dto.LandRequest;
import com.farmely.farm.dto.LandResponse;
import com.farmely.farm.service.LandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lands")
@RequiredArgsConstructor
@Tag(name = "Land Management", description = "Quản lý khu nông trại Farmely (Lands / Master Properties)")
@CrossOrigin(origins = "*")
public class LandController {

    private final LandService landService;

    @GetMapping
    @Operation(summary = "Lấy danh sách nông trại", description = "Hỗ trợ tìm kiếm theo tên nông trại hoặc địa chỉ")
    public ResponseEntity<ApiResponse<List<LandResponse>>> getAllLands(
            @RequestParam(required = false) String search) {
        List<LandResponse> lands = landService.getAllLands(search);
        return ResponseEntity.ok(ApiResponse.success(lands));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết nông trại", description = "Bao gồm thống kê và danh sách các thửa đất trực thuộc")
    public ResponseEntity<ApiResponse<LandDetailResponse>> getLandById(@PathVariable("id") Integer id) {
        LandDetailResponse land = landService.getLandById(id);
        return ResponseEntity.ok(ApiResponse.success(land));
    }

    @PostMapping
    @Operation(summary = "Tạo mới nông trại", description = "Dành cho Quản trị viên khởi tạo khu nông trại mới")
    public ResponseEntity<ApiResponse<LandResponse>> createLand(@Valid @RequestBody LandRequest request) {
        LandResponse created = landService.createLand(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nông trại mới thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin nông trại", description = "Chỉnh sửa tên và địa chỉ của nông trại")
    public ResponseEntity<ApiResponse<LandResponse>> updateLand(
            @PathVariable("id") Integer id,
            @Valid @RequestBody LandRequest request) {
        LandResponse updated = landService.updateLand(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nông trại thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa nông trại", description = "Chỉ cho phép xóa khi nông trại không còn thửa đất nào đang được thuê")
    public ResponseEntity<ApiResponse<Void>> deleteLand(@PathVariable("id") Integer id) {
        landService.deleteLand(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa nông trại thành công", null));
    }
}
