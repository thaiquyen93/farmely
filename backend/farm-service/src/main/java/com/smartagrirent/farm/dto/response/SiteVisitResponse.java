package com.smartagrirent.farm.dto.response;

import com.smartagrirent.farm.constant.VisitSlot;
import com.smartagrirent.farm.constant.VisitStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class SiteVisitResponse {

    private Integer visitId;
    private Integer plotId;
    private String plotCode;
    private String visitorName;
    private String visitorPhone;
    private String visitorEmail;
    private LocalDate visitDate;
    private VisitSlot visitSlot;
    private Integer groupSize;
    private String notes;
    private VisitStatus status;
    private OffsetDateTime createdAt;

    public SiteVisitResponse() {
    }

    public Integer getVisitId() {
        return visitId;
    }

    public void setVisitId(Integer visitId) {
        this.visitId = visitId;
    }

    public Integer getPlotId() {
        return plotId;
    }

    public void setPlotId(Integer plotId) {
        this.plotId = plotId;
    }

    public String getPlotCode() {
        return plotCode;
    }

    public void setPlotCode(String plotCode) {
        this.plotCode = plotCode;
    }

    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public String getVisitorPhone() {
        return visitorPhone;
    }

    public void setVisitorPhone(String visitorPhone) {
        this.visitorPhone = visitorPhone;
    }

    public String getVisitorEmail() {
        return visitorEmail;
    }

    public void setVisitorEmail(String visitorEmail) {
        this.visitorEmail = visitorEmail;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public VisitSlot getVisitSlot() {
        return visitSlot;
    }

    public void setVisitSlot(VisitSlot visitSlot) {
        this.visitSlot = visitSlot;
    }

    public Integer getGroupSize() {
        return groupSize;
    }

    public void setGroupSize(Integer groupSize) {
        this.groupSize = groupSize;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public VisitStatus getStatus() {
        return status;
    }

    public void setStatus(VisitStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
