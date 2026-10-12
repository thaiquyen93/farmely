package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.CreateIssueReportRequest;
import com.farmely.cultivation.dto.request.DiagnoseIssueRequest;
import com.farmely.cultivation.dto.response.IssueReportResponse;
import com.farmely.cultivation.service.IssueReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
@Tag(name = "Issue Reports", description = "Quản lý Báo cáo Sự cố & Xử lý Sâu bệnh Hiện trường (Expert Diagnosis)")
public class IssueReportController {

    private final IssueReportService issueReportService;

    @GetMapping
    @Operation(summary = "Lấy danh sách sự cố hiện trường", description = "Lọc theo mã lượt thuê (rentalId), trạng thái (OPEN, RESOLVED), người báo cáo (reportedBy), chuyên gia xử lý (handledBy)")
    public ResponseEntity<ApiResponse<List<IssueReportResponse>>> getAllIssues(
            @RequestParam(required = false) Integer rentalId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer reportedBy,
            @RequestParam(required = false) Integer handledBy
    ) {
        List<IssueReportResponse> list = issueReportService.getAllIssues(rentalId, status, reportedBy, handledBy);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết sự cố theo ID")
    public ResponseEntity<ApiResponse<IssueReportResponse>> getIssueById(@PathVariable("id") Integer id) {
        IssueReportResponse resp = issueReportService.getIssueById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Báo cáo sự cố sâu bệnh hoặc kỹ thuật hiện trường (Công nhân hoặc Khách hàng)")
    public ResponseEntity<ApiResponse<IssueReportResponse>> reportIssue(@Valid @RequestBody CreateIssueReportRequest request) {
        IssueReportResponse resp = issueReportService.reportIssue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Báo cáo sự cố thành công", resp));
    }

    @PutMapping("/{id}/diagnose")
    @Operation(summary = "Chuyên gia nông nghiệp thẩm định & đưa ra chỉ đạo kỹ thuật/phác đồ xử lý")
    public ResponseEntity<ApiResponse<IssueReportResponse>> diagnoseIssue(
            @PathVariable("id") Integer id,
            @Valid @RequestBody DiagnoseIssueRequest request
    ) {
        IssueReportResponse resp = issueReportService.diagnoseIssue(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Chẩn đoán và gửi chỉ đạo kỹ thuật thành công", resp));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Đánh dấu giải quyết hoàn tất sự cố")
    public ResponseEntity<ApiResponse<IssueReportResponse>> resolveIssue(
            @PathVariable("id") Integer id,
            @RequestParam(required = false) String notes
    ) {
        IssueReportResponse resp = issueReportService.resolveIssue(id, notes);
        return ResponseEntity.ok(ApiResponse.ok("Giải quyết sự cố thành công", resp));
    }
}
