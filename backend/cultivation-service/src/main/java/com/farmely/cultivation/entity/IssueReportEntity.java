package com.farmely.cultivation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;

@Entity
@Table(name = "issue_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "issue_id")
    private Integer issueId;

    @Column(name = "rental_id", nullable = false)
    private Integer rentalId;

    @Column(name = "reported_by", nullable = false)
    private Integer reportedBy;

    @Column(name = "handled_by")
    private Integer handledBy;

    @Column(name = "issue_type", length = 100)
    private String issueType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "issue_status_enum")
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
