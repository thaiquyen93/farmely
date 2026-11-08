package com.smartagrirent.farm.dto.request;

import com.smartagrirent.farm.constant.VisitSlot;
import java.time.LocalDate;

public class CreateSiteVisitRequest {

    private Integer plotId;
    private String visitorName;
    private String visitorPhone;
    private String visitorEmail;
    private LocalDate visitDate;
    private VisitSlot visitSlot = VisitSlot.MORNING;
    private Integer groupSize = 1;
    private String notes;

    public CreateSiteVisitRequest() {
    }

    public Integer getPlotId() {
        return plotId;
    }

    public void setPlotId(Integer plotId) {
        this.plotId = plotId;
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
}
