package com.smartagrirent.communication.dto.response;

import java.time.OffsetDateTime;

public class MessageResponse {
    private Long messageId;
    private Integer conversationId;
    private Integer senderId;
    private String senderName;
    private String content;
    private String attachmentUrl;
    private String time;
    private OffsetDateTime createdAt;

    public MessageResponse() {
    }

    public MessageResponse(Long messageId, Integer conversationId, Integer senderId, String senderName,
                           String content, String attachmentUrl, String time, OffsetDateTime createdAt) {
        this.messageId = messageId;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.attachmentUrl = attachmentUrl;
        this.time = time;
        this.createdAt = createdAt;
    }

    public static MessageResponseBuilder builder() {
        return new MessageResponseBuilder();
    }

    public static class MessageResponseBuilder {
        private Long messageId;
        private Integer conversationId;
        private Integer senderId;
        private String senderName;
        private String content;
        private String attachmentUrl;
        private String time;
        private OffsetDateTime createdAt;

        public MessageResponseBuilder messageId(Long messageId) {
            this.messageId = messageId;
            return this;
        }

        public MessageResponseBuilder conversationId(Integer conversationId) {
            this.conversationId = conversationId;
            return this;
        }

        public MessageResponseBuilder senderId(Integer senderId) {
            this.senderId = senderId;
            return this;
        }

        public MessageResponseBuilder senderName(String senderName) {
            this.senderName = senderName;
            return this;
        }

        public MessageResponseBuilder content(String content) {
            this.content = content;
            return this;
        }

        public MessageResponseBuilder attachmentUrl(String attachmentUrl) {
            this.attachmentUrl = attachmentUrl;
            return this;
        }

        public MessageResponseBuilder time(String time) {
            this.time = time;
            return this;
        }

        public MessageResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(messageId, conversationId, senderId, senderName, content, attachmentUrl, time, createdAt);
        }
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Integer getConversationId() {
        return conversationId;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public Integer getSenderId() {
        return senderId;
    }

    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
