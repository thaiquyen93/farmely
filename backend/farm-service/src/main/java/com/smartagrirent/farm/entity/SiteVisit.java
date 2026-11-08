package com.smartagrirent.farm.entity;

import com.smartagrirent.farm.constant.VisitSlot;
import com.smartagrirent.farm.constant.VisitStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "site_visits")
public class SiteVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "visit_id")
    private Integer visitId;

    @Column(name = "plot_id")
    private Integer plotId;

    @Column(name = "visitor_name", nullable = false, length = 150)
    private String visitorName;

    @Column(name = "visitor_phone", nullable = false, length = 20)
    private String visitorPhone;

    @Column(name = "visitor_email", length = 150)
    private String visitorEmail;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_slot", nullable = false, length = 20)
    private VisitSlot visitSlot = VisitSlot.MORNING;

    @Column(name = "group_size", nullable = false)
    private Integer groupSize = 1;

    @Column(name = "notes", length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VisitStatus status = VisitStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public SiteVisit() {
    }

    public SiteVisit(Integer visitId, Integer plotId, String visitorName, String visitorPhone,
                     String visitorEmail, LocalDate visitDate, VisitSlot visitSlot, Integer groupSize,
                     String notes, VisitStatus status, OffsetDateTime createdAt) {
        this.visitId = visitId;
        this.plotId = plotId;
        this.visitorName = visitorName;
        this.visitorPhone = visitorPhone;
        this.visitorEmail = visitorEmail;
        this.visitDate = visitDate;
        this.visitSlot = visitSlot;
        this.groupSize = groupSize;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
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
