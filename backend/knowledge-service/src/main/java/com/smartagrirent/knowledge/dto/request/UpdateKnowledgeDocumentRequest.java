package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKnowledgeDocumentRequest {

    @Size(min = 3, max = 255, message = "Tiêu đề tài liệu từ 3 đến 255 ký tự")
    private String title;

    private String content;

    private String fileUrl;

    private Integer varietyId;

    private String documentType;

    private String version;

    private String fileSize;

    private Boolean isIndexedForRAG;

    private Integer sectionsCount;

    private String status;

    private String authorName;
}
