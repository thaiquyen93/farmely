package com.smartagrirent.communication.dto.request;

import com.smartagrirent.communication.constant.ConversationType;

public class CreateConversationRequest {
    private Integer participantOne;
    private Integer participantTwo;
    private Integer rentalId;
    private Integer plotId;
    private ConversationType type;

    public CreateConversationRequest() {
    }

    public CreateConversationRequest(Integer participantOne, Integer participantTwo, Integer rentalId, Integer plotId, ConversationType type) {
        this.participantOne = participantOne;
        this.participantTwo = participantTwo;
        this.rentalId = rentalId;
        this.plotId = plotId;
        this.type = type;
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
}
