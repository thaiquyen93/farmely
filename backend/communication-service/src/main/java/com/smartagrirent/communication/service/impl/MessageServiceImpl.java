package com.smartagrirent.communication.service.impl;

import com.smartagrirent.communication.constant.ConversationStatus;
import com.smartagrirent.communication.constant.ConversationType;
import com.smartagrirent.communication.dto.request.SendMessageRequest;
import com.smartagrirent.communication.dto.response.MessageResponse;
import com.smartagrirent.communication.entity.Conversation;
import com.smartagrirent.communication.entity.Message;
import com.smartagrirent.communication.repository.ConversationRepository;
import com.smartagrirent.communication.repository.MessageRepository;
import com.smartagrirent.communication.service.MessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public MessageServiceImpl(MessageRepository messageRepository, ConversationRepository conversationRepository) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .participantOne(request.getSenderId() != null ? request.getSenderId() : 1)
                            .participantTwo(2)
                            .type(ConversationType.CUST_EXP)
                            .status(ConversationStatus.OPEN)
                            .build();
                    return conversationRepository.save(newConv);
                });

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(request.getSenderId())
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        Message saved = messageRepository.save(message);

        String timeStr = saved.getCreatedAt() != null ? saved.getCreatedAt().format(TIME_FORMATTER) : "Vừa xong";

        return MessageResponse.builder()
                .messageId(saved.getMessageId())
                .conversationId(conversation.getConversationId())
                .senderId(saved.getSenderId())
                .senderName(request.getSenderName())
                .content(saved.getContent())
                .attachmentUrl(saved.getAttachmentUrl())
                .time(timeStr)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByConversationId(Integer conversationId) {
        return messageRepository.findByConversation_ConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(msg -> {
                    String timeStr = msg.getCreatedAt() != null ? msg.getCreatedAt().format(TIME_FORMATTER) : "Vừa xong";
                    return MessageResponse.builder()
                            .messageId(msg.getMessageId())
                            .conversationId(conversationId)
                            .senderId(msg.getSenderId())
                            .content(msg.getContent())
                            .attachmentUrl(msg.getAttachmentUrl())
                            .time(timeStr)
                            .createdAt(msg.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
