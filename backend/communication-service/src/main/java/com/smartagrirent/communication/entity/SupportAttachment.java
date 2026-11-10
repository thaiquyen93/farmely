package com.smartagrirent.communication.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "support_attachments")
public class SupportAttachment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false) public Long ticketId;
    @Column(nullable = false) public Integer uploaderId;
    @Column(nullable = false, length = 150) public String fileName;
    @Column(nullable = false, length = 50) public String contentType;
    @Column(nullable = false, columnDefinition = "bytea") public byte[] content;
    @Column(nullable = false) public OffsetDateTime createdAt = OffsetDateTime.now();
}
