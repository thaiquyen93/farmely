package com.smartagrirent.communication.dto.response;

import java.time.OffsetDateTime;

public class NotificationResponse {
    private Long notificationId;
    private Integer userId;
    private String title;
    private String content;
    private Boolean isRead;
    private OffsetDateTime createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long notificationId, Integer userId, String title, String content, Boolean isRead, OffsetDateTime createdAt) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public static NotificationResponseBuilder builder() {
        return new NotificationResponseBuilder();
    }

    public static class NotificationResponseBuilder {
        private Long notificationId;
        private Integer userId;
        private String title;
        private String content;
        private Boolean isRead;
        private OffsetDateTime createdAt;

        public NotificationResponseBuilder notificationId(Long notificationId) {
            this.notificationId = notificationId;
            return this;
        }

        public NotificationResponseBuilder userId(Integer userId) {
            this.userId = userId;
            return this;
        }

        public NotificationResponseBuilder title(String title) {
            this.title = title;
            return this;
        }

        public NotificationResponseBuilder content(String content) {
            this.content = content;
            return this;
        }

        public NotificationResponseBuilder isRead(Boolean isRead) {
            this.isRead = isRead;
            return this;
        }

        public NotificationResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public NotificationResponse build() {
            return new NotificationResponse(notificationId, userId, title, content, isRead, createdAt);
        }
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
