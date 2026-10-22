package com.smartagrirent.ai.service;

import com.smartagrirent.ai.dto.ChatRequest;
import com.smartagrirent.ai.dto.ChatResponse;

public interface AiChatService {

    /**
     * Xử lý hội thoại nông nghiệp thông minh qua Farmely AI Chatbot (RAG & NLP)
     */
    ChatResponse processChat(ChatRequest request);
}
