package com.farmely.farm.service;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.entity.PlotEntity;
import com.farmely.farm.repository.PlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * BR23: Quản lý chu kỳ nghỉ đất (Soil Recovery Period)
 * Sau 4 ngày nghỉ đất/phục hồi vi sinh, thửa đất tự động chuyển về AVAILABLE và công khai marketplace.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SoilMaintenanceScheduler {

    private final PlotRepository plotRepository;

    @Value("${farmely.maintenance.days:4}")
    private int maintenanceDays;

    @Scheduled(fixedDelayString = "${farmely.maintenance.check-interval-ms:60000}")
    @Transactional
    public void monitorCompletedSoilMaintenance() {
        List<PlotEntity> maintainingPlots = plotRepository.findByStatus(PlotStatus.MAINT);
        if (maintainingPlots.isEmpty()) return;

        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(maintenanceDays);

        for (PlotEntity plot : maintainingPlots) {
            OffsetDateTime lastUpdated = plot.getUpdatedAt() != null ? plot.getUpdatedAt() : plot.getCreatedAt();
            if (lastUpdated != null && lastUpdated.isBefore(cutoff)) {
                plot.setStatus(PlotStatus.AVAIL);
                plot.setIsPublished(true); // Mở lại trên marketplace theo BR23
                plotRepository.save(plot);
                log.info("[BR23 Soil Recovery] Thửa đất ID {} ({}) đã hoàn tất {} ngày nghỉ đất. Tự động chuyển về AVAILABLE!",
                        plot.getPlotId(), plot.getPlotCode(), maintenanceDays);
            }
        }
    }
}
