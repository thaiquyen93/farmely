package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.CreateServiceRequest;
import com.farmely.cultivation.dto.request.UpdateServiceRequest;
import com.farmely.cultivation.dto.response.ServiceResponse;
import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceType;
import com.farmely.cultivation.service.ServiceCatalogueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Tag(name = "Services", description = "Quản lý Danh mục Dịch vụ Canh tác & Gói chăm sóc nông trại")
public class ServiceCatalogueController {

    private final ServiceCatalogueService serviceCatalogueService;

    @GetMapping
    @Operation(summary = "Lấy danh sách dịch vụ", description = "Hỗ trợ lọc theo loại dịch vụ (FULL, A_LA_CARTE) và trạng thái (ACTIVE, INACTIVE)")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getAllServices(
            @RequestParam(required = false) ServiceType type,
            @RequestParam(required = false) ActiveStatus status
    ) {
        List<ServiceResponse> list = serviceCatalogueService.getAllServices(type, status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết dịch vụ theo ID")
    public ResponseEntity<ApiResponse<ServiceResponse>> getServiceById(@PathVariable("id") Integer id) {
        ServiceResponse resp = serviceCatalogueService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Tạo mới dịch vụ canh tác")
    public ResponseEntity<ApiResponse<ServiceResponse>> createService(@Valid @RequestBody CreateServiceRequest request) {
        ServiceResponse resp = serviceCatalogueService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo dịch vụ thành công", resp));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật dịch vụ")
    public ResponseEntity<ApiResponse<ServiceResponse>> updateService(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateServiceRequest request
    ) {
        ServiceResponse resp = serviceCatalogueService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật dịch vụ thành công", resp));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa/Ngừng kích hoạt dịch vụ")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable("id") Integer id) {
        serviceCatalogueService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.ok("Ngừng kích hoạt dịch vụ thành công", null));
    }
}
