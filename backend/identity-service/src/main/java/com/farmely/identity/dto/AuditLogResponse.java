package com.farmely.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long logId;
    private Integer userId;
    private String userEmail;
    private String action;
    private String entityType;
    private String entityId;
    private String description;
    private String ipAddress;
    private String status;
    private OffsetDateTime createdAt;
}
