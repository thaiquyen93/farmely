package com.smartagrirent.knowledge.controller;

import com.smartagrirent.knowledge.dto.request.CreateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.request.UpdateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.response.ApiResponse;
import com.smartagrirent.knowledge.dto.response.ProcessTemplateResponse;
import com.smartagrirent.knowledge.service.ProcessTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/templates", "/api/v1/templates"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Process Templates", description = "Quy trình chăm sóc tiêu chuẩn cho từng giống cây (UC23, UC24, UC25, UC26)")
public class ProcessTemplateController {

    private final ProcessTemplateService templateService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả quy trình chuẩn")
    public ResponseEntity<ApiResponse<List<ProcessTemplateResponse>>> getAll(
            @RequestParam(required = false) Integer varietyId
    ) {
        List<ProcessTemplateResponse> list = (varietyId != null)
                ? templateService.getTemplatesByVarietyId(varietyId)
                : templateService.getAllTemplates();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết quy trình chuẩn và các bước thực hiện")
    public ResponseEntity<ApiResponse<ProcessTemplateResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(templateService.getTemplateById(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo quy trình mẫu chuẩn hóa mới kèm các bước canh tác (UC23)")
    public ResponseEntity<ApiResponse<ProcessTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateProcessTemplateRequest request
    ) {
        ProcessTemplateResponse created = templateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo quy trình chuẩn thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật quy trình chuẩn và chỉnh sửa các bước (UC24)")
    public ResponseEntity<ApiResponse<ProcessTemplateResponse>> updateTemplate(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateProcessTemplateRequest request
    ) {
        ProcessTemplateResponse updated = templateService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật quy trình chuẩn thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa quy trình chuẩn")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Integer id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa quy trình chuẩn thành công", null));
    }
}
