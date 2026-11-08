package com.farmely.rental.controller;

import com.farmely.rental.dto.common.ApiResponse;
import com.farmely.rental.dto.request.CheckAvailabilityRequest;
import com.farmely.rental.dto.request.RenewRentalRequest;
import com.farmely.rental.dto.response.AvailabilityCheckResponse;
import com.farmely.rental.dto.response.RentalResponse;
import com.farmely.rental.entity.RentalStatus;
import com.farmely.rental.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
@Tag(name = "Rentals", description = "Quản lý Lượt thuê thửa đất & Gia hạn (Subsystem 3)")
public class RentalController {

    private final RentalService rentalService;

    @PostMapping("/check-availability")
    @Operation(summary = "Kiểm tra tính khả dụng, độ tương thích giống rau & chu kỳ tối thiểu (BR03, BR04, BR07)")
    public ResponseEntity<ApiResponse<AvailabilityCheckResponse>> checkAvailability(
            @Valid @RequestBody CheckAvailabilityRequest request) {
        AvailabilityCheckResponse response = rentalService.checkAvailability(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một lượt thuê đất theo ID")
    public ResponseEntity<ApiResponse<RentalResponse>> getRentalById(
            @PathVariable Integer id) {
        RentalResponse response = rentalService.getRentalById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các lượt thuê đất (lọc theo customer/renter, plot, contract, status)")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getAllRentals(
            @RequestParam(required = false) Integer renterId,
            @RequestParam(required = false) Integer plotId,
            @RequestParam(required = false) Integer contractId,
            @RequestParam(required = false) RentalStatus status) {
        List<RentalResponse> list = rentalService.getAllRentals(renterId, plotId, contractId, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{id}/renew")
    @Operation(summary = "Gia hạn hợp đồng/lượt thuê kế thừa lịch sử thửa đất (BR12)")
    public ResponseEntity<ApiResponse<RentalResponse>> renewRental(
            @PathVariable Integer id,
            @Valid @RequestBody RenewRentalRequest request) {
        RentalResponse response = rentalService.renewRental(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Gia hạn hợp đồng thành công"));
    }
}
