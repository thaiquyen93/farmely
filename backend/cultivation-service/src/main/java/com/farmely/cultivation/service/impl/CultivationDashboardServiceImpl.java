package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.response.CultivationDashboardResponse;
import com.farmely.cultivation.entity.IssueStatus;
import com.farmely.cultivation.entity.RequestStatus;
import com.farmely.cultivation.entity.TaskStatus;
import com.farmely.cultivation.repository.*;
import com.farmely.cultivation.service.CultivationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CultivationDashboardServiceImpl implements CultivationDashboardService {

    private final CareTaskRepository careTaskRepository;
    private final IssueReportRepository issueReportRepository;
    private final HarvestResultRepository harvestResultRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Override
    @Transactional(readOnly = true)
    public CultivationDashboardResponse getDashboardStats(Integer workerId, Integer rentalId) {
        long totalTasks;
        long completedTasks;
        long inProgressTasks;
        long pendingTasks;
        long overdueTasks;

        if (workerId != null) {
            LocalDate today = LocalDate.now();
            totalTasks = careTaskRepository.countTasksForWorkerOnDate(workerId, today);
            completedTasks = careTaskRepository.countCompletedTasksForWorkerOnDate(workerId, today);
            inProgressTasks = careTaskRepository.findByTaskAssignedToOrderByDueDateAsc(workerId).stream()
                    .filter(t -> t.getStatus() == TaskStatus.IN_PROG).count();
            pendingTasks = Math.max(0, totalTasks - completedTasks);
            overdueTasks = careTaskRepository.countOverdueTasks(today);
        } else {
            totalTasks = careTaskRepository.count();
            completedTasks = careTaskRepository.countByStatus(TaskStatus.DONE);
            inProgressTasks = careTaskRepository.countByStatus(TaskStatus.IN_PROG);
            pendingTasks = careTaskRepository.countByStatus(TaskStatus.PENDING);
            overdueTasks = careTaskRepository.countOverdueTasks(LocalDate.now());
        }

        int completionPercentage = totalTasks > 0 ? (int) Math.round(((double) completedTasks / totalTasks) * 100) : 0;

        long openIssues = issueReportRepository.countByStatus(IssueStatus.OPEN);
        long resolvedIssues = issueReportRepository.countByStatus(IssueStatus.RESOLVED);

        long pendingHarvests = harvestResultRepository.countByCustomerConfirmed(false);
        long completedHarvests = harvestResultRepository.countByCustomerConfirmed(true);
        BigDecimal totalYield = harvestResultRepository.sumTotalYieldAmount();

        long totalServices = serviceRepository.count();
        long pendingRequests = serviceRequestRepository.countByStatus(RequestStatus.PENDING);

        return CultivationDashboardResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .overdueTasks(overdueTasks)
                .completionPercentage(completionPercentage)
                .openIssues(openIssues)
                .resolvedIssues(resolvedIssues)
                .pendingHarvests(pendingHarvests)
                .completedHarvests(completedHarvests)
                .totalYieldAmount(totalYield)
                .totalServices(totalServices)
                .pendingServiceRequests(pendingRequests)
                .build();
    }
}
