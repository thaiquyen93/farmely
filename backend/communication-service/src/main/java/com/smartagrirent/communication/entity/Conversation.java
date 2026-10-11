package com.smartagrirent.communication.entity;

import com.smartagrirent.communication.constant.ConversationStatus;
import com.smartagrirent.communication.constant.ConversationType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Integer conversationId;

    @Column(name = "participant_one", nullable = false)
    private Integer participantOne;

    @Column(name = "participant_two")
    private Integer participantTwo;

    @Column(name = "rental_id")
    private Integer rentalId;

    @Column(name = "plot_id")
    private Integer plotId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ConversationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConversationStatus status = ConversationStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<Message> messages = new ArrayList<>();

    public Conversation() {
    }

    public Conversation(Integer conversationId, Integer participantOne, Integer participantTwo,
                        Integer rentalId, Integer plotId, ConversationType type,
                        ConversationStatus status, OffsetDateTime createdAt, List<Message> messages) {
        this.conversationId = conversationId;
        this.participantOne = participantOne;
        this.participantTwo = participantTwo;
        this.rentalId = rentalId;
        this.plotId = plotId;
        this.type = type;
        this.status = status != null ? status : ConversationStatus.OPEN;
        this.createdAt = createdAt;
        this.messages = messages != null ? messages : new ArrayList<>();
    }

    public static ConversationBuilder builder() {
        return new ConversationBuilder();
    }

    public static class ConversationBuilder {
        private Integer conversationId;
        private Integer participantOne;
        private Integer participantTwo;
        private Integer rentalId;
        private Integer plotId;
        private ConversationType type;
        private ConversationStatus status = ConversationStatus.OPEN;
        private OffsetDateTime createdAt;
        private List<Message> messages = new ArrayList<>();

        public ConversationBuilder conversationId(Integer conversationId) {
            this.conversationId = conversationId;
            return this;
        }

        public ConversationBuilder participantOne(Integer participantOne) {
            this.participantOne = participantOne;
            return this;
        }

        public ConversationBuilder participantTwo(Integer participantTwo) {
            this.participantTwo = participantTwo;
            return this;
        }

        public ConversationBuilder rentalId(Integer rentalId) {
            this.rentalId = rentalId;
            return this;
        }

        public ConversationBuilder plotId(Integer plotId) {
            this.plotId = plotId;
            return this;
        }

        public ConversationBuilder type(ConversationType type) {
            this.type = type;
            return this;
        }

        public ConversationBuilder status(ConversationStatus status) {
            this.status = status;
            return this;
        }

        public ConversationBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ConversationBuilder messages(List<Message> messages) {
            this.messages = messages;
            return this;
        }

        public Conversation build() {
            return new Conversation(conversationId, participantOne, participantTwo, rentalId, plotId, type, status, createdAt, messages);
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

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }
}
