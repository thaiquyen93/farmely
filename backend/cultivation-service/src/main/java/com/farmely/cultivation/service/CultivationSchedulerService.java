package com.farmely.cultivation.service;

import com.farmely.cultivation.repository.CareTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CultivationSchedulerService {

    private final CareTaskRepository careTaskRepository;

    /**
     * BR15: Runs every hour to monitor overdue care tasks
     */
    @Scheduled(cron = "0 0 * * * *")
    public void monitorOverdueTasks() {
        LocalDate today = LocalDate.now();
        List<CareTaskEntity> overdueTasks = careTaskRepository.findByStatusNotAndDueDateBefore(TaskStatus.DONE, today);
        if (!overdueTasks.isEmpty()) {
            log.warn("[BR15 Overdue Alert] Phát hiện {} tác vụ chăm sóc hiện trường quá hạn (chưa hoàn thành trước {}): {}",
                    overdueTasks.size(), today,
                    overdueTasks.stream().map(t -> "#" + t.getTaskId() + " (Rental " + t.getRentalId() + ", Due " + t.getDueDate() + ")").toList());
        }
    }
}
