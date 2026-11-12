package com.smartagrirent.communication.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false) public Integer customerId;
    @Column(nullable = false, length = 40) public String category;
    @Column(nullable = false, length = 200) public String title;
    @Column(nullable = false, columnDefinition = "TEXT") public String description;
    @Column(nullable = false, length = 30) public String status = "NEW";
    public Integer plotId;
    public Integer contractId;
    public Integer paymentId;
    public Integer assigneeId;
    @Column(nullable = false) public OffsetDateTime createdAt = OffsetDateTime.now();
    @Column(nullable = false) public OffsetDateTime updatedAt = OffsetDateTime.now();
}
