package com.smartagrirent.communication.dto.request;

public class SendMessageRequest {
    private Integer conversationId;
    private Integer senderId;
    private String senderName;
    private String content;
    private String attachmentUrl;

    public SendMessageRequest() {
    }

    public SendMessageRequest(Integer conversationId, Integer senderId, String senderName, String content, String attachmentUrl) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.attachmentUrl = attachmentUrl;
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
}
