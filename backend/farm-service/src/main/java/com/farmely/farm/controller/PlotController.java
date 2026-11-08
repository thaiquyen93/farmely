package com.farmely.farm.controller;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.dto.*;
import com.farmely.farm.service.PlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/plots")
@RequiredArgsConstructor
@Tag(name = "Plot & Marketplace Management", description = "Quản lý thửa đất (Plots) và Sàn giao dịch thửa đất trực tuyến")
@CrossOrigin(origins = "*")
public class PlotController {

    private final PlotService plotService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thửa đất (Bộ lọc Admin/Tổng quát)", description = "Lọc theo nông trại, trạng thái, cây trồng, diện tích, giá và từ khóa")
    public ResponseEntity<ApiResponse<List<PlotResponse>>> getAllPlots(
            @RequestParam(required = false) Integer landId,
            @RequestParam(required = false) PlotStatus status,
            @RequestParam(required = false) Boolean isPublished,
            @RequestParam(required = false) Integer cropId,
            @RequestParam(required = false) Integer varietyId,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) BigDecimal maxArea,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search) {

        PlotFilterCriteria criteria = PlotFilterCriteria.builder()
                .landId(landId)
                .status(status)
                .isPublished(isPublished)
                .cropId(cropId)
                .varietyId(varietyId)
                .minArea(minArea)
                .maxArea(maxArea)
                .maxPrice(maxPrice)
                .search(search)
                .build();

        List<PlotResponse> plots = plotService.getAllPlots(criteria);
        return ResponseEntity.ok(ApiResponse.success(plots));
    }

    @GetMapping("/marketplace")
    @Operation(summary = "Lấy danh sách thửa đất hiển thị trên Sàn Marketplace (SRS UC04)",
               description = "Chỉ trả về các thửa đất có trạng thái AVAILABLE và isPublished = true, loại trừ các thửa đang bảo dưỡng/nghỉ đất (MAINT)")
    public ResponseEntity<ApiResponse<List<PlotResponse>>> getMarketplacePlots(
            @RequestParam(required = false) Integer landId,
            @RequestParam(required = false) Integer cropId,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) BigDecimal maxArea,
            @RequestParam(required = false) BigDecimal maxPrice) {

        List<PlotResponse> plots = plotService.getMarketplacePlots(landId, cropId, minArea, maxArea, maxPrice);
        return ResponseEntity.ok(ApiResponse.success(plots));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết thửa đất theo ID", description = "Bao gồm thông tin nông trại và danh sách các giống cây tương thích")
    public ResponseEntity<ApiResponse<PlotResponse>> getPlotById(@PathVariable("id") Integer id) {
        PlotResponse plot = plotService.getPlotById(id);
        return ResponseEntity.ok(ApiResponse.success(plot));
    }

    @GetMapping("/code/{plotCode}")
    @Operation(summary = "Tìm thửa đất theo mã định danh (Plot Code)", description = "Ví dụ: P-01, P-02")
    public ResponseEntity<ApiResponse<PlotResponse>> getPlotByCode(@PathVariable("plotCode") String plotCode) {
        PlotResponse plot = plotService.getPlotByCode(plotCode);
        return ResponseEntity.ok(ApiResponse.success(plot));
    }

    @PostMapping
    @Operation(summary = "Tạo mới thửa đất (SRS UC20, SCR-AD-03)", description = "Quản trị viên khởi tạo thửa đất, kiểm tra mã duy nhất (V19.1) và diện tích > 0 (V19.2)")
    public ResponseEntity<ApiResponse<PlotResponse>> createPlot(@Valid @RequestBody PlotCreateRequest request) {
        PlotResponse created = plotService.createPlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thửa đất mới thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật toàn diện thông tin thửa đất", description = "Chỉnh sửa diện tích, đơn giá, ảnh, trạng thái và ma trận cây tương thích")
    public ResponseEntity<ApiResponse<PlotResponse>> updatePlot(
            @PathVariable("id") Integer id,
            @Valid @RequestBody PlotUpdateRequest request) {
        PlotResponse updated = plotService.updatePlot(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thửa đất thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật nhanh trạng thái thửa đất", description = "Chuyển đổi giữa AVAIL, RENT, MAINT")
    public ResponseEntity<ApiResponse<PlotResponse>> updatePlotStatus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody PlotStatusUpdateRequest request) {
        PlotResponse updated = plotService.updatePlotStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thửa đất thành công", updated));
    }

    @PatchMapping("/{id}/publish")
    @Operation(summary = "Bật/Tắt niêm yết thửa đất lên Marketplace", description = "isPublished = true để đưa lên sàn giao dịch trực tuyến")
    public ResponseEntity<ApiResponse<PlotResponse>> updatePlotPublish(
            @PathVariable("id") Integer id,
            @Valid @RequestBody PlotPublishUpdateRequest request) {
        PlotResponse updated = plotService.updatePlotPublish(id, request.getIsPublished());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái niêm yết thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thửa đất", description = "Chỉ cho phép xóa khi thửa đất không ở trạng thái đang được thuê (RENT)")
    public ResponseEntity<ApiResponse<Void>> deletePlot(@PathVariable("id") Integer id) {
        plotService.deletePlot(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thửa đất thành công", null));
    }

    @GetMapping("/{id}/compatibility")
    @Operation(summary = "Lấy ma trận giống cây trồng tương thích của thửa đất", description = "Danh sách các giống cây được chứng nhận phù hợp thổ nhưỡng thửa đất này")
    public ResponseEntity<ApiResponse<List<VarietySummaryResponse>>> getCompatibleVarieties(@PathVariable("id") Integer id) {
        List<VarietySummaryResponse> varieties = plotService.getCompatibleVarieties(id);
        return ResponseEntity.ok(ApiResponse.success(varieties));
    }

    @PutMapping("/{id}/compatibility")
    @Operation(summary = "Cập nhật ma trận giống cây trồng tương thích", description = "Gán danh sách các ID giống cây (varieties) phù hợp cho thửa đất")
    public ResponseEntity<ApiResponse<List<VarietySummaryResponse>>> updatePlotCompatibility(
            @PathVariable("id") Integer id,
            @Valid @RequestBody PlotCompatibilityUpdateRequest request) {
        List<VarietySummaryResponse> updated = plotService.updatePlotCompatibility(id, request.getVarietyIds());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cây trồng tương thích thành công", updated));
    }

    @PostMapping("/{id}/maintenance/start")
    @Operation(summary = "Bắt đầu chu kỳ nghỉ đất 4 ngày (SRS BR01, BR02, BR21)", description = "Chuyển trạng thái sang MAINT và tự động ẩn khỏi sàn Marketplace")
    public ResponseEntity<ApiResponse<PlotResponse>> startSoilMaintenance(@PathVariable("id") Integer id) {
        PlotResponse plot = plotService.startSoilMaintenance(id);
        return ResponseEntity.ok(ApiResponse.success("Thửa đất đã chuyển sang chế độ nghỉ đất (MAINTENANCE)", plot));
    }

    @PostMapping("/{id}/maintenance/complete")
    @Operation(summary = "Hoàn tất chu kỳ nghỉ đất", description = "Đưa thửa đất trở lại trạng thái AVAILABLE sẵn sàng cho vụ thuê mới")
    public ResponseEntity<ApiResponse<PlotResponse>> completeSoilMaintenance(@PathVariable("id") Integer id) {
        PlotResponse plot = plotService.completeSoilMaintenance(id);
        return ResponseEntity.ok(ApiResponse.success("Thửa đất đã hoàn thành bảo dưỡng, mở lại AVAILABLE", plot));
    }
}
