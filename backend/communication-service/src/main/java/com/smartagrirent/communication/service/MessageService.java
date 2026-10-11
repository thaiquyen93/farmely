package com.smartagrirent.communication.service;

import com.smartagrirent.communication.dto.request.SendMessageRequest;
import com.smartagrirent.communication.dto.response.MessageResponse;

import java.util.List;

public interface MessageService {
    MessageResponse sendMessage(SendMessageRequest request);
    List<MessageResponse> getMessagesByConversationId(Integer conversationId);
}
