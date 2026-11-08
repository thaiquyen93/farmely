package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.CreateDiaryRequest;
import com.farmely.cultivation.dto.request.UpdateDiaryRequest;
import com.farmely.cultivation.dto.response.FarmDiaryResponse;
import com.farmely.cultivation.service.FarmDiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
@Tag(name = "Farm Diaries", description = "Quản lý Nhật ký Canh tác Nông trại Minh bạch (VietGAP Timeline)")
public class FarmDiaryController {

    private final FarmDiaryService farmDiaryService;

    @GetMapping
    @Operation(summary = "Lấy danh sách nhật ký nông trại", description = "Lọc theo mã lượt thuê (rentalId) để hiển thị dòng thời gian sinh trưởng")
    public ResponseEntity<ApiResponse<List<FarmDiaryResponse>>> getAllDiaries(
            @RequestParam(required = false) Integer rentalId
    ) {
        List<FarmDiaryResponse> list = farmDiaryService.getAllDiaries(rentalId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết bản ghi nhật ký")
    public ResponseEntity<ApiResponse<FarmDiaryResponse>> getDiaryById(@PathVariable("id") Integer id) {
        FarmDiaryResponse resp = farmDiaryService.getDiaryById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Thêm bản ghi nhật ký mới")
    public ResponseEntity<ApiResponse<FarmDiaryResponse>> createDiary(@Valid @RequestBody CreateDiaryRequest request) {
        FarmDiaryResponse resp = farmDiaryService.createDiary(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Thêm nhật ký thành công", resp));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bản ghi nhật ký")
    public ResponseEntity<ApiResponse<FarmDiaryResponse>> updateDiary(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateDiaryRequest request
    ) {
        FarmDiaryResponse resp = farmDiaryService.updateDiary(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật nhật ký thành công", resp));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bản ghi nhật ký")
    public ResponseEntity<ApiResponse<Void>> deleteDiary(@PathVariable("id") Integer id) {
        farmDiaryService.deleteDiary(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa nhật ký thành công", null));
    }
}
