package com.smartagrirent.ai.service;

import com.smartagrirent.ai.dto.ChatRequest;
import com.smartagrirent.ai.dto.ChatResponse;

public interface AiChatService {

    /**
     * Xử lý hội thoại thông minh Bác Ba Nông Dân qua RAG & NLP
     */
    ChatResponse processChat(ChatRequest request);
}
