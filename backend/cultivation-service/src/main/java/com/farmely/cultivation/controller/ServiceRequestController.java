package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.AssignWorkerRequest;
import com.farmely.cultivation.dto.request.BookServiceRequest;
import com.farmely.cultivation.dto.response.ServiceRequestResponse;
import com.farmely.cultivation.entity.RequestStatus;
import com.farmely.cultivation.service.ServiceRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services/requests")
@RequiredArgsConstructor
@Tag(name = "Service Requests", description = "Quản lý Đặt Dịch vụ Phát sinh & Phân công công nhân")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    @GetMapping
    @Operation(summary = "Lấy danh sách yêu cầu dịch vụ", description = "Lọc theo mã lượt thuê (rentalId) hoặc trạng thái (PENDING, ASSIGNED, DONE)")
    public ResponseEntity<ApiResponse<List<ServiceRequestResponse>>> getAllRequests(
            @RequestParam(required = false) Integer rentalId,
            @RequestParam(required = false) RequestStatus status
    ) {
        List<ServiceRequestResponse> list = serviceRequestService.getAllRequests(rentalId, status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết yêu cầu dịch vụ theo ID")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> getRequestById(@PathVariable("id") Integer id) {
        ServiceRequestResponse resp = serviceRequestService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Khách hàng đặt yêu cầu dịch vụ phát sinh")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> bookService(@Valid @RequestBody BookServiceRequest request) {
        ServiceRequestResponse resp = serviceRequestService.bookService(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Đặt dịch vụ thành công", resp));
    }

    @PutMapping("/{id}/assign")
    @Operation(summary = "Phân công công nhân thực hiện dịch vụ", description = "Tự động sinh nhiệm vụ (care_task) cho công nhân ngoài ruộng")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> assignWorker(
            @PathVariable("id") Integer id,
            @Valid @RequestBody AssignWorkerRequest request
    ) {
        ServiceRequestResponse resp = serviceRequestService.assignWorker(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Phân công nhân viên thành công", resp));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái yêu cầu dịch vụ")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> updateStatus(
            @PathVariable("id") Integer id,
            @RequestParam RequestStatus status
    ) {
        ServiceRequestResponse resp = serviceRequestService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", resp));
    }
}
