package com.smartagrirent.communication.service;

import com.smartagrirent.communication.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getNotificationsByUserId(Integer userId);
    long getUnreadCount(Integer userId);
    void markAsRead(Long notificationId);
    void createNotification(Integer userId, String title, String content);
}
