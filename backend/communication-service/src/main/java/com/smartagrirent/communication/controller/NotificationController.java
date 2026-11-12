package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.dto.response.ApiResponse;
import com.smartagrirent.communication.dto.response.NotificationResponse;
import com.smartagrirent.communication.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification API", description = "Endpoints for in-app user notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user notifications")
    public ApiResponse<List<NotificationResponse>> getNotifications(@RequestParam Integer userId) {
        return ApiResponse.ok(notificationService.getNotificationsByUserId(userId));
    }

    @PostMapping
    @Operation(summary = "Create user notification")
    public ApiResponse<NotificationResponse> createNotification(@RequestBody Map<String, Object> body) {
        Object rawUserId = body.get("userId");
        Integer userId = rawUserId instanceof Number
                ? ((Number) rawUserId).intValue()
                : Integer.parseInt(String.valueOf(rawUserId).replaceAll("\\D+", ""));
        String title = String.valueOf(body.getOrDefault("title", "Thông báo hệ thống"));
        String content = String.valueOf(body.getOrDefault("content", ""));
        return ApiResponse.ok(notificationService.createAndGetNotification(userId, title, content));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notifications count")
    public ApiResponse<Long> getUnreadCount(@RequestParam Integer userId) {
        return ApiResponse.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ApiResponse<Void> markAsRead(@PathVariable("id") Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.ok("Đã đánh dấu đã đọc", null);
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all user notifications as read")
    public ApiResponse<Void> markAllAsRead(@RequestParam Integer userId) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.ok("Đã đánh dấu đọc tất cả", null);
    }
}
