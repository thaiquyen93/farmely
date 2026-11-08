package com.farmely.cultivation.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CultivationDashboardResponse {

    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long overdueTasks;
    private int completionPercentage;

    private long openIssues;
    private long resolvedIssues;

    private long pendingHarvests;
    private long completedHarvests;
    private BigDecimal totalYieldAmount;

    private long totalServices;
    private long pendingServiceRequests;
}
