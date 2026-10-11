package com.smartagrirent.knowledge.controller;

import com.smartagrirent.knowledge.dto.request.CreateVarietyRequest;
import com.smartagrirent.knowledge.dto.response.ApiResponse;
import com.smartagrirent.knowledge.dto.response.VarietyResponse;
import com.smartagrirent.knowledge.service.VarietyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/varieties", "/api/v1/varieties"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Varieties", description = "Danh mục giống cây trồng sinh học")
public class VarietyController {

    private final VarietyService varietyService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả giống cây trồng")
    public ResponseEntity<ApiResponse<List<VarietyResponse>>> getAll(
            @RequestParam(required = false) Integer cropId
    ) {
        List<VarietyResponse> list = (cropId != null)
                ? varietyService.getVarietiesByCropId(cropId)
                : varietyService.getAllVarieties();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một giống cây trồng")
    public ResponseEntity<ApiResponse<VarietyResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(varietyService.getVarietyById(id)));
    }

    @PostMapping
    @Operation(summary = "Thêm giống cây trồng mới")
    public ResponseEntity<ApiResponse<VarietyResponse>> create(@Valid @RequestBody CreateVarietyRequest request) {
        VarietyResponse created = varietyService.createVariety(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Thêm giống cây thành công", created));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa giống cây trồng")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        varietyService.deleteVariety(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa giống cây thành công", null));
    }
}
