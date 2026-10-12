package com.smartagrirent.knowledge.controller;

import com.smartagrirent.knowledge.dto.request.CreateCropRequest;
import com.smartagrirent.knowledge.dto.response.ApiResponse;
import com.smartagrirent.knowledge.dto.response.CropResponse;
import com.smartagrirent.knowledge.service.CropService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/crops", "/api/v1/crops"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Crops", description = "Danh mục chủng loại cây trồng nông nghiệp")
public class CropController {

    private final CropService cropService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả loại cây trồng")
    public ResponseEntity<ApiResponse<List<CropResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(cropService.getAllCrops()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một loại cây trồng")
    public ResponseEntity<ApiResponse<CropResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(cropService.getCropById(id)));
    }

    @PostMapping
    @Operation(summary = "Thêm loại cây trồng mới")
    public ResponseEntity<ApiResponse<CropResponse>> create(@Valid @RequestBody CreateCropRequest request) {
        CropResponse created = cropService.createCrop(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Thêm loại cây thành công", created));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa loại cây trồng")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        cropService.deleteCrop(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa loại cây thành công", null));
    }
}
