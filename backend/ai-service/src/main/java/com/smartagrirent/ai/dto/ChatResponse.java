package com.smartagrirent.ai.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private String conversationId;
    private String reply;
    private List<ReferencedDocumentDto> referencedDocuments;
    private String status;
}
