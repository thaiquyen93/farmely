package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateKnowledgeDocumentRequest {

    @NotBlank(message = "Tiêu đề tài liệu không được để trống")
    @Size(min = 3, max = 255, message = "Tiêu đề tài liệu từ 3 đến 255 ký tự")
    private String title;

    private String content;

    private String fileUrl;

    private Integer varietyId;

    @Builder.Default
    private String documentType = "CULTIVATION_GUIDE";

    @Builder.Default
    private String version = "v1.0";

    private String fileSize;

    @Builder.Default
    private Boolean isIndexedForRAG = true;

    @Builder.Default
    private Integer sectionsCount = 1;

    private String authorName;

    private Integer createdBy;
}
