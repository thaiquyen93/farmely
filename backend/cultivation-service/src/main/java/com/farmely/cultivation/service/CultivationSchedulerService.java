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
        long overdueCount = careTaskRepository.countOverdueTasks(today);
        if (overdueCount > 0) {
            log.info("[Scheduler] Hiện tại có {} tác vụ chăm sóc quá hạn (Overdue) theo quy tắc BR15", overdueCount);
        }
    }
}
