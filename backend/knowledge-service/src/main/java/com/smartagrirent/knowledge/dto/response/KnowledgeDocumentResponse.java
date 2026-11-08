package com.smartagrirent.knowledge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentResponse {
    private String id;
    private Integer documentId;
    private Integer createdBy;
    private String title;
    private String content;
    private String description;
    private String fileUrl;
    private Integer varietyId;
    private String varietyName;
    private String cropName;
    private String documentType;
    private String version;
    private String fileSize;
    private Boolean isIndexedForRAG;
    private Integer sectionsCount;
    private String status;
    private String author;
    private String uploadedDate;
    private OffsetDateTime createdAt;
}
