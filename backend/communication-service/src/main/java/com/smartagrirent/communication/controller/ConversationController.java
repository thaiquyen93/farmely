package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.dto.request.CreateConversationRequest;
import com.smartagrirent.communication.dto.request.SendMessageRequest;
import com.smartagrirent.communication.dto.response.ApiResponse;
import com.smartagrirent.communication.dto.response.ConversationResponse;
import com.smartagrirent.communication.dto.response.MessageResponse;
import com.smartagrirent.communication.service.ConversationService;
import com.smartagrirent.communication.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@Tag(name = "Conversation & Chat API", description = "Endpoints for consultation chat, AI conversation and messages")
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    @GetMapping
    @Operation(summary = "Get conversations (all or filtered by user)")
    public ApiResponse<List<ConversationResponse>> getConversations(@RequestParam(required = false) Integer userId) {
        List<ConversationResponse> list = userId != null
                ? conversationService.getConversationsByUserId(userId)
                : conversationService.getAllConversations();
        return ApiResponse.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation by ID")
    public ApiResponse<ConversationResponse> getConversationById(@PathVariable("id") Integer id) {
        return ApiResponse.ok(conversationService.getConversationById(id));
    }

    @PostMapping
    @Operation(summary = "Create or get existing direct conversation")
    public ApiResponse<ConversationResponse> createOrGetConversation(@RequestBody CreateConversationRequest request) {
        return ApiResponse.ok("Khởi tạo cuộc hội thoại thành công", conversationService.getOrCreateDirectConversation(request));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get messages of a conversation")
    public ApiResponse<List<MessageResponse>> getMessages(@PathVariable("id") Integer id) {
        return ApiResponse.ok(messageService.getMessagesByConversationId(id));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send a new message into conversation")
    public ApiResponse<MessageResponse> sendMessage(
            @PathVariable("id") Integer id,
            @RequestBody SendMessageRequest request) {
        request.setConversationId(id);
        MessageResponse sent = messageService.sendMessage(request);
        return ApiResponse.ok("Gửi tin nhắn thành công", sent);
    }

    @PatchMapping("/{id}/close")
    @Operation(summary = "Close conversation")
    public ApiResponse<Void> closeConversation(@PathVariable("id") Integer id) {
        conversationService.closeConversation(id);
        return ApiResponse.ok("Đã đóng cuộc hội thoại", null);
    }
}
