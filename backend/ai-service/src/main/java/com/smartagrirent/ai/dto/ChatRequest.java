package com.smartagrirent.ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {
    private Integer userId;
    private String message;
    private Integer plotId;
    private String conversationId;
}
