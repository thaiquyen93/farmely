package com.farmely.identity.service;

import com.farmely.identity.dto.AuditLogResponse;
import com.farmely.identity.dto.CreateAuditLogRequest;
import org.springframework.data.domain.Page;

import java.time.OffsetDateTime;
import java.util.Map;

public interface AuditLogService {

    void log(CreateAuditLogRequest request);

    void log(Integer userId, String userEmail, String action, String entityType, String entityId, String description, String ipAddress, String status);

    Page<AuditLogResponse> getLogs(String action, String entityType, String userEmail, OffsetDateTime startDate, OffsetDateTime endDate, int page, int size);

    Map<String, Object> getAuditOverview();
}
