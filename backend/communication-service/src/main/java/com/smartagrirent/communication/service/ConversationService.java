package com.smartagrirent.communication.service;

import com.smartagrirent.communication.dto.request.CreateConversationRequest;
import com.smartagrirent.communication.dto.response.ConversationResponse;

import java.util.List;

public interface ConversationService {
    List<ConversationResponse> getAllConversations();
    List<ConversationResponse> getConversationsByUserId(Integer userId);
    ConversationResponse getConversationById(Integer conversationId);
    ConversationResponse getOrCreateDirectConversation(CreateConversationRequest request);
    void closeConversation(Integer conversationId);
}
