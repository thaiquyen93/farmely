package com.smartagrirent.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "knowledge_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @Column(name = "kd_created_by", nullable = false)
    private Integer kdCreatedBy;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "variety_id")
    private Integer varietyId;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "version", length = 50)
    private String version;

    @Column(name = "file_size", length = 50)
    private String fileSize;

    @Builder.Default
    @Column(name = "is_indexed_for_rag")
    private Boolean isIndexedForRAG = true;

    @Builder.Default
    @Column(name = "sections_count")
    private Integer sectionsCount = 1;

    @Builder.Default
    @Column(name = "status", length = 50)
    private String status = "PUBLISHED";

    @Column(name = "author_name", length = 150)
    private String authorName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
