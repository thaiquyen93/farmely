package com.smartagrirent.communication.dto.response;

import com.smartagrirent.communication.constant.ConversationStatus;
import com.smartagrirent.communication.constant.ConversationType;

import java.time.OffsetDateTime;
import java.util.List;

public class ConversationResponse {
    private Integer conversationId;
    private Integer participantOne;
    private Integer participantTwo;
    private Integer rentalId;
    private Integer plotId;
    private ConversationType type;
    private ConversationStatus status;
    private OffsetDateTime createdAt;
    private MessageResponse lastMessage;
    private List<MessageResponse> messages;

    public ConversationResponse() {
    }

    public ConversationResponse(Integer conversationId, Integer participantOne, Integer participantTwo,
                                Integer rentalId, Integer plotId, ConversationType type,
                                ConversationStatus status, OffsetDateTime createdAt,
                                MessageResponse lastMessage, List<MessageResponse> messages) {
        this.conversationId = conversationId;
        this.participantOne = participantOne;
        this.participantTwo = participantTwo;
        this.rentalId = rentalId;
        this.plotId = plotId;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
        this.lastMessage = lastMessage;
        this.messages = messages;
    }

    public static ConversationResponseBuilder builder() {
        return new ConversationResponseBuilder();
    }

    public static class ConversationResponseBuilder {
        private Integer conversationId;
        private Integer participantOne;
        private Integer participantTwo;
        private Integer rentalId;
        private Integer plotId;
        private ConversationType type;
        private ConversationStatus status;
        private OffsetDateTime createdAt;
        private MessageResponse lastMessage;
        private List<MessageResponse> messages;

        public ConversationResponseBuilder conversationId(Integer conversationId) {
            this.conversationId = conversationId;
            return this;
        }

        public ConversationResponseBuilder participantOne(Integer participantOne) {
            this.participantOne = participantOne;
            return this;
        }

        public ConversationResponseBuilder participantTwo(Integer participantTwo) {
            this.participantTwo = participantTwo;
            return this;
        }

        public ConversationResponseBuilder rentalId(Integer rentalId) {
            this.rentalId = rentalId;
            return this;
        }

        public ConversationResponseBuilder plotId(Integer plotId) {
            this.plotId = plotId;
            return this;
        }

        public ConversationResponseBuilder type(ConversationType type) {
            this.type = type;
            return this;
        }

        public ConversationResponseBuilder status(ConversationStatus status) {
            this.status = status;
            return this;
        }

        public ConversationResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ConversationResponseBuilder lastMessage(MessageResponse lastMessage) {
            this.lastMessage = lastMessage;
            return this;
        }

        public ConversationResponseBuilder messages(List<MessageResponse> messages) {
            this.messages = messages;
            return this;
        }

        public ConversationResponse build() {
            return new ConversationResponse(conversationId, participantOne, participantTwo, rentalId, plotId, type, status, createdAt, lastMessage, messages);
        }
    }

    public Integer getConversationId() {
        return conversationId;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public Integer getParticipantOne() {
        return participantOne;
    }

    public void setParticipantOne(Integer participantOne) {
        this.participantOne = participantOne;
    }

    public Integer getParticipantTwo() {
        return participantTwo;
    }

    public void setParticipantTwo(Integer participantTwo) {
        this.participantTwo = participantTwo;
    }

    public Integer getRentalId() {
        return rentalId;
    }

    public void setRentalId(Integer rentalId) {
        this.rentalId = rentalId;
    }

    public Integer getPlotId() {
        return plotId;
    }

    public void setPlotId(Integer plotId) {
        this.plotId = plotId;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
        this.type = type;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public MessageResponse getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(MessageResponse lastMessage) {
        this.lastMessage = lastMessage;
    }

    public List<MessageResponse> getMessages() {
        return messages;
    }

    public void setMessages(List<MessageResponse> messages) {
        this.messages = messages;
    }
}
