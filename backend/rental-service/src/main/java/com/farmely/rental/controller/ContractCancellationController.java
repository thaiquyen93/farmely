package com.farmely.rental.controller;

import com.farmely.rental.dto.common.ApiResponse;
import com.farmely.rental.dto.request.CreateCancellationRequest;
import com.farmely.rental.dto.response.ContractCancellationResponse;
import com.farmely.rental.entity.CancelStatus;
import com.farmely.rental.service.ContractCancellationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts/cancellations")
@RequiredArgsConstructor
@Tag(name = "Contract Cancellations", description = "Quản lý Hủy hợp đồng & Hoàn tiền theo tỷ lệ chính sách BR10")
public class ContractCancellationController {

    private final ContractCancellationService cancellationService;

    @PostMapping
    @Operation(summary = "Gửi yêu cầu hủy hợp đồng (Tự động tính mức hoàn tiền 80%/50%/0% theo BR10)")
    public ResponseEntity<ApiResponse<ContractCancellationResponse>> requestCancellation(
            @Valid @RequestBody CreateCancellationRequest request) {
        ContractCancellationResponse response = cancellationService.requestCancellation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gửi yêu cầu hủy hợp đồng thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các yêu cầu hủy hợp đồng")
    public ResponseEntity<ApiResponse<List<ContractCancellationResponse>>> getAllCancellations(
            @RequestParam(required = false) CancelStatus status) {
        List<ContractCancellationResponse> list = cancellationService.getAllCancellations(status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một yêu cầu hủy hợp đồng theo ID")
    public ResponseEntity<ApiResponse<ContractCancellationResponse>> getCancellationById(
            @PathVariable Integer id) {
        ContractCancellationResponse response = cancellationService.getCancellationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Quản trị viên phê duyệt yêu cầu hủy hợp đồng")
    public ResponseEntity<ApiResponse<ContractCancellationResponse>> approveCancellation(
            @PathVariable Integer id) {
        ContractCancellationResponse response = cancellationService.approveCancellation(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Phê duyệt hủy hợp đồng thành công"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Quản trị viên từ chối yêu cầu hủy hợp đồng")
    public ResponseEntity<ApiResponse<ContractCancellationResponse>> rejectCancellation(
            @PathVariable Integer id) {
        ContractCancellationResponse response = cancellationService.rejectCancellation(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Từ chối yêu cầu hủy hợp đồng thành công"));
    }
}
