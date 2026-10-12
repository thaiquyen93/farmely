package com.smartagrirent.communication.service.impl;

import com.smartagrirent.communication.constant.ConversationStatus;
import com.smartagrirent.communication.dto.request.CreateConversationRequest;
import com.smartagrirent.communication.dto.response.ConversationResponse;
import com.smartagrirent.communication.dto.response.MessageResponse;
import com.smartagrirent.communication.entity.Conversation;
import com.smartagrirent.communication.entity.Message;
import com.smartagrirent.communication.repository.ConversationRepository;
import com.smartagrirent.communication.repository.MessageRepository;
import com.smartagrirent.communication.service.ConversationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public ConversationServiceImpl(ConversationRepository conversationRepository, MessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getAllConversations() {
        return conversationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsByUserId(Integer userId) {
        return conversationRepository.findAllByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(Integer conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with id: " + conversationId));
        return mapToResponse(conversation);
    }

    @Override
    @Transactional
    public ConversationResponse getOrCreateDirectConversation(CreateConversationRequest request) {
        if (request.getParticipantTwo() != null) {
            var existing = conversationRepository.findDirectConversation(
                    request.getParticipantOne(),
                    request.getParticipantTwo(),
                    request.getType()
            );
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }

        Conversation newConv = Conversation.builder()
                .participantOne(request.getParticipantOne())
                .participantTwo(request.getParticipantTwo())
                .rentalId(request.getRentalId())
                .plotId(request.getPlotId())
                .type(request.getType())
                .status(ConversationStatus.OPEN)
                .build();

        Conversation saved = conversationRepository.save(newConv);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void closeConversation(Integer conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with id: " + conversationId));
        conversation.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conversation);
    }

    private ConversationResponse mapToResponse(Conversation conv) {
        List<MessageResponse> messageResponses = conv.getMessages() != null
                ? conv.getMessages().stream().map(this::mapMessageToResponse).collect(Collectors.toList())
                : List.of();

        MessageResponse lastMsg = messageResponses.isEmpty() ? null : messageResponses.get(messageResponses.size() - 1);

        return ConversationResponse.builder()
                .conversationId(conv.getConversationId())
                .participantOne(conv.getParticipantOne())
                .participantTwo(conv.getParticipantTwo())
                .rentalId(conv.getRentalId())
                .plotId(conv.getPlotId())
                .type(conv.getType())
                .status(conv.getStatus())
                .createdAt(conv.getCreatedAt())
                .lastMessage(lastMsg)
                .messages(messageResponses)
                .build();
    }

    private MessageResponse mapMessageToResponse(Message msg) {
        String timeStr = msg.getCreatedAt() != null ? msg.getCreatedAt().format(TIME_FORMATTER) : "Vừa xong";
        return MessageResponse.builder()
                .messageId(msg.getMessageId())
                .conversationId(msg.getConversation() != null ? msg.getConversation().getConversationId() : null)
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .attachmentUrl(msg.getAttachmentUrl())
                .time(timeStr)
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
