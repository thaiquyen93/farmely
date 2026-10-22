package com.smartagrirent.ai.controller;

import com.smartagrirent.ai.dto.ChatRequest;
import com.smartagrirent.ai.dto.ChatResponse;
import com.smartagrirent.ai.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "AI Chatbot API", description = "Hệ thống AI Farmely Chatbot - Trợ lý Nông nghiệp thông minh qua RAG & NLP")
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @Operation(summary = "Gửi tin nhắn hỏi đáp nông nghiệp tới Farmely AI Chatbot")
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        ChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Kiểm tra trạng thái hoạt động của microservice AI")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "UP");
        map.put("service", "Farmely AI Chatbot Service");
        map.put("ragReady", true);
        return ResponseEntity.ok(map);
    }
}
