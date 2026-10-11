package com.smartagrirent.knowledge.controller;

import com.smartagrirent.knowledge.dto.response.ApiResponse;
import com.smartagrirent.knowledge.dto.response.ProcessTemplateResponse;
import com.smartagrirent.knowledge.service.ProcessTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/templates", "/api/v1/templates"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Process Templates", description = "Quy trình chăm sóc tiêu chuẩn cho từng giống cây")
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
}
