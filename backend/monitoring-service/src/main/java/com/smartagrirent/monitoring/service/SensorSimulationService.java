package com.smartagrirent.monitoring.service;

import com.smartagrirent.monitoring.dto.response.PlotSensorSummaryResponse;
import com.smartagrirent.monitoring.dto.response.SensorReadingResponse;
import com.smartagrirent.monitoring.entity.SensorReading;
import com.smartagrirent.monitoring.repository.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensorSimulationService {

    private final SensorReadingRepository readingRepository;
    private final SensorSseService sseService;

    @Value("${farmely.sensor.simulation.enabled:true}")
    private boolean simulationEnabled;

    @Value("${farmely.sensor.simulation.plots:1,2,3,4}")
    private String simulatedPlotsConfig;

    private List<Integer> getActivePlotIds() {
        return Arrays.stream(simulatedPlotsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    /**
     * Tự động khởi tạo 24 điểm dữ liệu lịch sử cho các Plot mẫu khi app khởi động
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!simulationEnabled) {
            log.info("Sensor simulation is disabled by configuration.");
            return;
        }

        try {
            List<Integer> plotIds = getActivePlotIds();
            for (Integer plotId : plotIds) {
                long count = readingRepository.countByPlotId(plotId);
                if (count < 10) {
                    log.info("Seeding 24 hours of mock sensor data for plotId {}", plotId);
                    seedHistoryForPlot(plotId, 24);
                }
            }
        } catch (Exception e) {
            log.warn("Database may not be initialized yet. Skipping initial seed: {}", e.getMessage());
        }
    }

    /**
     * Tự động sinh dữ liệu định kỳ (mặc định mỗi 15 giây) và đẩy qua SSE
     */
    @Scheduled(fixedRateString = "${farmely.sensor.simulation.interval-ms:15000}")
    @Transactional
    public void runPeriodicSimulation() {
        if (!simulationEnabled) return;

        try {
            List<Integer> plotIds = getActivePlotIds();
            for (Integer plotId : plotIds) {
                SensorReading reading = generateNextReading(plotId);
                SensorReading saved = readingRepository.save(reading);
                SensorReadingResponse response = SensorReadingResponse.fromEntity(saved);

                // Broadcast real-time sang tất cả client đang kết nối SSE
                sseService.broadcastReading(response);
            }
        } catch (Exception e) {
            log.debug("Simulation cycle skipped or encountered an error: {}", e.getMessage());
        }
    }

    /**
     * Sinh bản ghi tiếp theo dựa trên bản ghi trước đó (Random walk mượt mà)
     */
    public SensorReading generateNextReading(Integer plotId) {
        Optional<SensorReading> latestOpt = readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(plotId);

        double prevTemp = 28.5;
        double prevAirHum = 72.0;
        double prevSoilHum = 65.0;

        if (latestOpt.isPresent()) {
            SensorReading latest = latestOpt.get();
            if (latest.getTemperature() != null) prevTemp = latest.getTemperature().doubleValue();
            if (latest.getAirHumidity() != null) prevAirHum = latest.getAirHumidity().doubleValue();
            if (latest.getSoilHumidity() != null) prevSoilHum = latest.getSoilHumidity().doubleValue();
        }

        // Dao động ngẫu nhiên nhẹ quanh giá trị trước
        double nextTemp = clamp(prevTemp + randomStep(-0.35, 0.35), 22.0, 36.5);
        double nextAirHum = clamp(prevAirHum + randomStep(-1.0, 1.0), 50.0, 90.0);
        double nextSoilHum = clamp(prevSoilHum + randomStep(-0.6, 0.6), 42.0, 85.0);

        return SensorReading.builder()
                .plotId(plotId)
                .temperature(round(nextTemp))
                .airHumidity(round(nextAirHum))
                .soilHumidity(round(nextSoilHum))
                .recordedAt(Instant.now())
                .build();
    }

    /**
     * Lấy bản ghi mới nhất của một thửa đất
     */
    public SensorReadingResponse getLatestReading(Integer plotId) {
        return readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(plotId)
                .map(SensorReadingResponse::fromEntity)
                .orElseGet(() -> {
                    // Nếu chưa có, sinh ngay 1 bản ghi mới
                    SensorReading created = readingRepository.save(generateNextReading(plotId));
                    return SensorReadingResponse.fromEntity(created);
                });
    }

    /**
     * Lấy lịch sử đo đạc trong N giờ qua (sắp xếp tăng dần theo thời gian để vẽ biểu đồ)
     */
    public List<SensorReadingResponse> getReadingHistory(Integer plotId, int hours) {
        Instant since = Instant.now().minus(hours, ChronoUnit.HOURS);
        List<SensorReading> readings = readingRepository.findByPlotIdAndRecordedAtAfterOrderByRecordedAtAsc(plotId, since);

        if (readings.isEmpty()) {
            // Tự động seed nếu rỗng
            seedHistoryForPlot(plotId, Math.max(hours, 12));
            readings = readingRepository.findByPlotIdAndRecordedAtAfterOrderByRecordedAtAsc(plotId, since);
        }

        return readings.stream()
                .map(SensorReadingResponse::fromEntity)
                .toList();
    }

    /**
     * Lấy tóm tắt chỉ số trung bình 24h & trạng thái
     */
    public PlotSensorSummaryResponse getPlotSummary(Integer plotId) {
        SensorReadingResponse latest = getLatestReading(plotId);
        Instant since24h = Instant.now().minus(24, ChronoUnit.HOURS);

        Double avgTemp = readingRepository.findAvgTemperature(plotId, since24h);
        Double avgAir = readingRepository.findAvgAirHumidity(plotId, since24h);
        Double avgSoil = readingRepository.findAvgSoilHumidity(plotId, since24h);

        return PlotSensorSummaryResponse.builder()
                .plotId(plotId)
                .latestReading(latest)
                .avgTemperature(avgTemp != null ? roundDouble(avgTemp) : latest.getTemperature())
                .avgAirHumidity(avgAir != null ? roundDouble(avgAir) : latest.getAirHumidity())
                .avgSoilHumidity(avgSoil != null ? roundDouble(avgSoil) : latest.getSoilHumidity())
                .totalReadings24h(readingRepository.findByPlotIdAndRecordedAtAfterOrderByRecordedAtAsc(plotId, since24h).size())
                .build();
    }

    /**
     * Sinh nhanh 1 bản ghi ngẫu nhiên (dùng khi test thủ công hoặc trigger từ REST API)
     */
    @Transactional
    public SensorReadingResponse triggerManualMock(Integer plotId) {
        SensorReading reading = generateNextReading(plotId);
        SensorReading saved = readingRepository.save(reading);
        SensorReadingResponse response = SensorReadingResponse.fromEntity(saved);
        sseService.broadcastReading(response);
        return response;
    }

    /**
     * Seed danh sách lịch sử N giờ gần nhất theo chu kỳ ngày đêm thực tế
     */
    @Transactional
    public void seedHistoryForPlot(Integer plotId, int hours) {
        List<SensorReading> batch = new ArrayList<>();
        Instant now = Instant.now();

        for (int i = hours; i >= 0; i--) {
            Instant timestamp = now.minus(i, ChronoUnit.HOURS);
            ZonedDateTime zdt = timestamp.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
            int hour = zdt.getHour();

            // Mô phỏng nhiệt độ & độ ẩm theo giờ thực tế trong ngày
            double baseTemp;
            double baseAirHum;
            double baseSoilHum;

            if (hour >= 11 && hour <= 15) { // Buổi trưa - nắng nóng
                baseTemp = 32.5 + randomStep(-1.0, 1.5);
                baseAirHum = 58.0 + randomStep(-3.0, 4.0);
                baseSoilHum = 58.0 + randomStep(-2.0, 3.0);
            } else if (hour >= 6 && hour < 11) { // Buổi sáng
                baseTemp = 28.0 + randomStep(-1.0, 1.5);
                baseAirHum = 72.0 + randomStep(-3.0, 3.0);
                baseSoilHum = 64.0 + randomStep(-2.0, 3.0);
            } else if (hour > 15 && hour <= 19) { // Chiều mát
                baseTemp = 29.5 + randomStep(-1.0, 1.0);
                baseAirHum = 68.0 + randomStep(-2.0, 3.0);
                baseSoilHum = 62.0 + randomStep(-2.0, 2.0);
            } else { // Ban đêm
                baseTemp = 24.5 + randomStep(-1.0, 1.0);
                baseAirHum = 82.0 + randomStep(-3.0, 4.0);
                baseSoilHum = 68.0 + randomStep(-2.0, 3.0);
            }

            batch.add(SensorReading.builder()
                    .plotId(plotId)
                    .temperature(round(baseTemp))
                    .airHumidity(round(baseAirHum))
                    .soilHumidity(round(baseSoilHum))
                    .recordedAt(timestamp)
                    .build());
        }

        readingRepository.saveAll(batch);
        log.info("Seeded {} sensor history points for plot {}", batch.size(), plotId);
    }

    private double randomStep(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    private double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    private BigDecimal round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }

    private double roundDouble(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
