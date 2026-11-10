package com.smartagrirent.communication.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "support_events", indexes = @Index(name = "idx_support_events_ticket", columnList = "ticketId,createdAt"))
public class SupportEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false) public Long ticketId;
    @Column(nullable = false) public Integer actorId;
    @Column(nullable = false, length = 20) public String actorRole;
    @Column(nullable = false, length = 20) public String type;
    @Column(columnDefinition = "TEXT") public String body;
    @Column(length = 30) public String fromStatus;
    @Column(length = 30) public String toStatus;
    @Column(nullable = false) public OffsetDateTime createdAt = OffsetDateTime.now();
}
