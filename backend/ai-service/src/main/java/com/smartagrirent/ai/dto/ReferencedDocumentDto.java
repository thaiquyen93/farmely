package com.smartagrirent.ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferencedDocumentDto {
    private String chunkId;
    private String docTitle;
    private String sectionTitle;
    private String source;
    private Double similarityScore;
}
