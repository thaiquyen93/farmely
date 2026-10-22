package com.farmely.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAuditLogRequest {

    private Integer userId;
    private String userEmail;

    @NotBlank(message = "Hành động (action) không được để trống")
    private String action;

    private String entityType;
    private String entityId;
    private String description;
    private String ipAddress;
    private String status;
}
