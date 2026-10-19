package com.smartagrirent.farm.controller;

import com.smartagrirent.farm.constant.PlotStatus;
import com.smartagrirent.farm.dto.request.CreatePlotRequest;
import com.smartagrirent.farm.dto.request.UpdatePlotStatusRequest;
import com.smartagrirent.farm.dto.response.ApiResponse;
import com.smartagrirent.farm.dto.response.PlotResponse;
import com.smartagrirent.farm.service.PlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plots")
@RequiredArgsConstructor
@Tag(name = "Plot Management API", description = "Quản lý 16 thửa đất (Plots) và niêm yết Marketplace")
public class PlotController {

    private final PlotService plotService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thửa đất (Hỗ trợ lọc theo landId, status AVAIL/RENT/MAINT, và publishedOnly)")
    public ResponseEntity<ApiResponse<List<PlotResponse>>> getAllPlots(
            @RequestParam(required = false) Integer landId,
            @RequestParam(required = false) PlotStatus status,
            @RequestParam(required = false, defaultValue = "false") Boolean publishedOnly) {
        List<PlotResponse> list = plotService.getAllPlots(landId, status, publishedOnly);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thửa đất thành công", list));
    }

    @GetMapping("/{plotId}")
    @Operation(summary = "Lấy thông tin chi tiết một thửa đất theo ID")
    public ResponseEntity<ApiResponse<PlotResponse>> getPlotById(@PathVariable Integer plotId) {
        PlotResponse response = plotService.getPlotById(plotId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thửa đất thành công", response));
    }

    @GetMapping("/code/{plotCode}")
    @Operation(summary = "Lấy thông tin thửa đất theo mã thửa (vd: P-01, P-02)")
    public ResponseEntity<ApiResponse<PlotResponse>> getPlotByCode(@PathVariable String plotCode) {
        PlotResponse response = plotService.getPlotByCode(plotCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thửa đất thành công", response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới một thửa đất (Dành cho Admin)")
    public ResponseEntity<ApiResponse<PlotResponse>> createPlot(@Valid @RequestBody CreatePlotRequest request) {
        PlotResponse response = plotService.createPlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới thửa đất thành công", response));
    }

    @PatchMapping("/{plotId}/status")
    @Operation(summary = "Cập nhật trạng thái thửa đất (AVAIL, RENT, hoặc MAINT bảo trì 4 ngày theo BR23)")
    public ResponseEntity<ApiResponse<PlotResponse>> updatePlotStatus(
            @PathVariable Integer plotId,
            @Valid @RequestBody UpdatePlotStatusRequest request) {
        PlotResponse response = plotService.updatePlotStatus(plotId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thửa đất thành công", response));
    }

    @PatchMapping("/{plotId}/publish")
    @Operation(summary = "Bật hoặc tắt niêm yết thửa đất công khai trên Marketplace")
    public ResponseEntity<ApiResponse<PlotResponse>> togglePublish(
            @PathVariable Integer plotId,
            @RequestParam(required = false) Boolean published) {
        PlotResponse response = plotService.togglePublish(plotId, published);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái niêm yết thành công", response));
    }
}
