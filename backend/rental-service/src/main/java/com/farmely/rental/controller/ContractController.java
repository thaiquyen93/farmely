package com.farmely.rental.controller;

import com.farmely.rental.dto.common.ApiResponse;
import com.farmely.rental.dto.request.CreateReservationRequest;
import com.farmely.rental.dto.response.ContractResponse;
import com.farmely.rental.entity.ContractStatus;
import com.farmely.rental.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "Contracts & Reservations", description = "Quản lý Hợp đồng thuê đất & Giữ chỗ (Subsystem 3)")
public class ContractController {

    private final ContractService contractService;

    @PostMapping("/reservations")
    @Operation(summary = "Tạo đơn giữ chỗ (Reservation) tạm thời trong 15 phút (BR08)")
    public ResponseEntity<ApiResponse<ContractResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request) {
        ContractResponse response = contractService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo đơn giữ chỗ thành công (Hiệu lực 15 phút)"));
    }

    @PostMapping("/{id}/grace-period")
    @Operation(summary = "Cộng thời gian ân hạn 10 phút khi vào bước thanh toán (BR08)")
    public ResponseEntity<ApiResponse<ContractResponse>> extendGracePeriod(
            @PathVariable Integer id) {
        ContractResponse response = contractService.extendGracePeriod(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Cộng thời gian ân hạn 10 phút thành công"));
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Kích hoạt hợp đồng sau khi thanh toán 100% trọn gói (BR09)")
    public ResponseEntity<ApiResponse<ContractResponse>> activateContract(
            @PathVariable Integer id) {
        ContractResponse response = contractService.activateContract(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Kích hoạt hợp đồng thành công"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy hợp đồng chưa thanh toán")
    public ResponseEntity<ApiResponse<ContractResponse>> cancelUnpaidContract(
            @PathVariable Integer id) {
        ContractResponse response = contractService.cancelUnpaidContract(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy hợp đồng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết hợp đồng theo ID kèm danh sách thửa đất")
    public ResponseEntity<ApiResponse<ContractResponse>> getContractById(
            @PathVariable Integer id) {
        ContractResponse response = contractService.getContractById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/number/{contractNumber}")
    @Operation(summary = "Tra cứu hợp đồng theo mã hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> getContractByNumber(
            @PathVariable String contractNumber) {
        ContractResponse response = contractService.getContractByNumber(contractNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách hợp đồng (lọc theo khách hàng hoặc trạng thái)")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getAllContracts(
            @RequestParam(required = false) Integer renterId,
            @RequestParam(required = false) ContractStatus status) {
        List<ContractResponse> list = contractService.getAllContracts(renterId, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
