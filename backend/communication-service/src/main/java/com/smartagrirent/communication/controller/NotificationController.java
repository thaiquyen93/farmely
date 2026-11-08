package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.dto.response.ApiResponse;
import com.smartagrirent.communication.dto.response.NotificationResponse;
import com.smartagrirent.communication.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
