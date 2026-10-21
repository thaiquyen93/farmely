package com.farmely.identity.service.impl;

import com.farmely.identity.dto.AuditLogResponse;
import com.farmely.identity.dto.CreateAuditLogRequest;
import com.farmely.identity.entity.AuditLog;
import com.farmely.identity.repository.AuditLogRepository;
import com.farmely.identity.repository.UserRepository;
import com.farmely.identity.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void log(CreateAuditLogRequest request) {
        log(
            request.getUserId(),
            request.getUserEmail(),
            request.getAction(),
            request.getEntityType(),
            request.getEntityId(),
            request.getDescription(),
            request.getIpAddress(),
            request.getStatus() != null ? request.getStatus() : "SUCCESS"
        );
    }

    @Override
    @Transactional
    public void log(Integer userId, String userEmail, String action, String entityType, String entityId, String description, String ipAddress, String status) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .status(status != null ? status : "SUCCESS")
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Recorded audit log: action={}, user={}, entity={}:{}", action, userEmail, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to record audit log for action={}: {}", action, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogs(String action, String entityType, String userEmail, OffsetDateTime startDate, OffsetDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));

        // Chuẩn hóa input rỗng thành null
        String normalizedAction = (action != null && !action.isBlank()) ? action.trim() : null;
        String normalizedEntityType = (entityType != null && !entityType.isBlank()) ? entityType.trim() : null;
        String normalizedEmail = (userEmail != null && !userEmail.isBlank()) ? userEmail.trim() : null;

        Page<AuditLog> logPage = auditLogRepository.filterLogs(
                normalizedAction,
                normalizedEntityType,
                normalizedEmail,
                startDate,
                endDate,
                pageable
        );

        return logPage.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAuditOverview() {
        Map<String, Object> overview = new HashMap<>();
        long totalLogs = auditLogRepository.count();
        long loginsCount = auditLogRepository.countByAction("LOGIN");
        long passwordResetsCount = auditLogRepository.countByAction("PASSWORD_RESET");
        long roleChangesCount = auditLogRepository.countByAction("CHANGE_USER_STATUS");

        OffsetDateTime todayStart = OffsetDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long activitiesToday = auditLogRepository.countByCreatedAtAfter(todayStart);

        overview.put("totalLogs", totalLogs);
        overview.put("loginsCount", loginsCount);
        overview.put("passwordResetsCount", passwordResetsCount);
        overview.put("roleChangesCount", roleChangesCount);
        overview.put("activitiesToday", activitiesToday);
        overview.put("totalUsers", userRepository.count());

        return overview;
    }

    private AuditLogResponse toResponse(AuditLog entity) {
        return AuditLogResponse.builder()
                .logId(entity.getLogId())
                .userId(entity.getUserId())
                .userEmail(entity.getUserEmail())
                .action(entity.getAction())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .description(entity.getDescription())
                .ipAddress(entity.getIpAddress())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
