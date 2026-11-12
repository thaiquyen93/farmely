package com.smartagrirent.communication.service.impl;

import com.smartagrirent.communication.dto.response.NotificationResponse;
import com.smartagrirent.communication.entity.Notification;
import com.smartagrirent.communication.repository.NotificationRepository;
import com.smartagrirent.communication.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Integer userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Integer userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .collect(Collectors.toList());
        if (!unread.isEmpty()) {
            unread.forEach(n -> n.setIsRead(true));
            notificationRepository.saveAll(unread);
        }
    }

    @Override
    @Transactional
    public void createNotification(Integer userId, String title, String content) {
        createAndGetNotification(userId, title, content);
    }

    @Override
    @Transactional
    public NotificationResponse createAndGetNotification(Integer userId, String title, String content) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .content(n.getContent())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
