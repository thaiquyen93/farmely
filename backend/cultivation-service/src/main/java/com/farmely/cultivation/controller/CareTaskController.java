package com.farmely.cultivation.controller;

import com.farmely.cultivation.dto.common.ApiResponse;
import com.farmely.cultivation.dto.request.CompleteCareTaskRequest;
import com.farmely.cultivation.dto.request.CreateCareTaskRequest;
import com.farmely.cultivation.dto.request.GenerateTasksFromTemplateRequest;
import com.farmely.cultivation.dto.request.UpdateCareTaskRequest;
import com.farmely.cultivation.dto.response.CareTaskResponse;
import com.farmely.cultivation.service.CareTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Care Tasks", description = "Quản lý Tác vụ Chăm sóc Hiện trường của Công nhân (CVLĐ)")
public class CareTaskController {

    private final CareTaskService careTaskService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tác vụ chăm sóc", description = "Hỗ trợ lọc theo công nhân (workerId), lượt thuê (rentalId), trạng thái (PENDING, IN_PROGRESS, COMPLETED, OVERDUE), ngày thực hiện (date)")
    public ResponseEntity<ApiResponse<List<CareTaskResponse>>> getAllTasks(
            @RequestParam(required = false) Integer workerId,
            @RequestParam(required = false) Integer rentalId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<CareTaskResponse> list = careTaskService.getAllTasks(workerId, rentalId, status, date);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết tác vụ theo ID")
    public ResponseEntity<ApiResponse<CareTaskResponse>> getTaskById(@PathVariable("id") Integer id) {
        CareTaskResponse resp = careTaskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping
    @Operation(summary = "Tạo mới tác vụ chăm sóc thủ công hoặc khẩn cấp (BR18)")
    public ResponseEntity<ApiResponse<CareTaskResponse>> createTask(@Valid @RequestBody CreateCareTaskRequest request) {
        CareTaskResponse resp = careTaskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo tác vụ thành công", resp));
    }

    @PostMapping("/generate-from-template")
    @Operation(summary = "Tự động sinh các bước chăm sóc từ Quy trình Mẫu theo ngày (BR13)", description = "Nhân bản từ template_steps sang care_tasks cho toàn bộ chu kỳ mùa vụ")
    public ResponseEntity<ApiResponse<List<CareTaskResponse>>> generateTasksFromTemplate(
            @Valid @RequestBody GenerateTasksFromTemplateRequest request
    ) {
        List<CareTaskResponse> list = careTaskService.generateTasksFromTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Sinh tác vụ thành công", list));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin tác vụ")
    public ResponseEntity<ApiResponse<CareTaskResponse>> updateTask(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateCareTaskRequest request
    ) {
        CareTaskResponse resp = careTaskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tác vụ thành công", resp));
    }

    @PutMapping("/{id}/assign")
    @Operation(summary = "Phân công công nhân cho tác vụ")
    public ResponseEntity<ApiResponse<CareTaskResponse>> assignTask(
            @PathVariable("id") Integer id,
            @RequestParam Integer workerId
    ) {
        CareTaskResponse resp = careTaskService.assignTask(id, workerId);
        return ResponseEntity.ok(ApiResponse.ok("Phân công tác vụ thành công", resp));
    }

    @PutMapping("/{id}/start")
    @Operation(summary = "Bắt đầu thực hiện tác vụ (chuyển sang IN_PROGRESS)")
    public ResponseEntity<ApiResponse<CareTaskResponse>> startTask(@PathVariable("id") Integer id) {
        CareTaskResponse resp = careTaskService.startTask(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã bắt đầu thực hiện tác vụ", resp));
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Xác nhận hoàn thành tác vụ với ảnh minh chứng hiện trường (BR16 & BR17)", description = "Bắt buộc có ảnh minh chứng. Tự động đồng bộ vào Nhật ký canh tác (Farm Diary).")
    public ResponseEntity<ApiResponse<CareTaskResponse>> completeTask(
            @PathVariable("id") Integer id,
            @Valid @RequestBody CompleteCareTaskRequest request
    ) {
        CareTaskResponse resp = careTaskService.completeTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Xác nhận hoàn tất tác vụ và đồng bộ nhật ký thành công", resp));
    }

    @GetMapping("/overdue/count")
    @Operation(summary = "Kiểm tra số lượng tác vụ quá hạn (BR15)")
    public ResponseEntity<ApiResponse<Long>> getOverdueCount() {
        long count = careTaskService.checkAndMarkOverdueTasks();
        return ResponseEntity.ok(ApiResponse.ok(count));
    }
}
