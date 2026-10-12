package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.ConfirmHarvestRequest;
import com.farmely.cultivation.dto.request.RecordHarvestRequest;
import com.farmely.cultivation.dto.response.HarvestResultResponse;
import com.farmely.cultivation.service.HarvestResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/harvest")
@RequiredArgsConstructor
@Tag(name = "Harvest Results", description = "Quản lý Cân đo Sản lượng Thu hoạch & Nghiệm thu Bàn giao (BR20)")
public class HarvestResultController {

    private final HarvestResultService harvestResultService;

    @GetMapping
    @Operation(summary = "Lấy danh sách kết quả thu hoạch", description = "Lọc theo mã lượt thuê (rentalId) hoặc trạng thái nghiệm thu của khách (customerConfirmed)")
    public ResponseEntity<ApiResponse<List<HarvestResultResponse>>> getAllHarvests(
            @RequestParam(required = false) Integer rentalId,
            @RequestParam(required = false) Boolean customerConfirmed
    ) {
        List<HarvestResultResponse> list = harvestResultService.getAllHarvests(rentalId, customerConfirmed);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết kết quả thu hoạch theo ID")
    public ResponseEntity<ApiResponse<HarvestResultResponse>> getHarvestById(@PathVariable("id") Integer id) {
        HarvestResultResponse resp = harvestResultService.getHarvestById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Công nhân ghi nhận sản lượng cân điện tử & ảnh minh chứng thu hoạch (BR20)")
    public ResponseEntity<ApiResponse<HarvestResultResponse>> recordHarvest(@Valid @RequestBody RecordHarvestRequest request) {
        HarvestResultResponse resp = harvestResultService.recordHarvest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Ghi nhận thu hoạch thành công", resp));
    }

    @PutMapping("/{id}/confirm")
    @Operation(summary = "Khách hàng xác nhận nghiệm thu sản lượng nông sản")
    public ResponseEntity<ApiResponse<HarvestResultResponse>> confirmHarvest(
            @PathVariable("id") Integer id,
            @RequestBody(required = false) ConfirmHarvestRequest request
    ) {
        if (request == null) {
            request = ConfirmHarvestRequest.builder().confirmed(true).build();
        }
        HarvestResultResponse resp = harvestResultService.confirmHarvest(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Khách hàng đã xác nhận nghiệm thu nông sản", resp));
    }
}
