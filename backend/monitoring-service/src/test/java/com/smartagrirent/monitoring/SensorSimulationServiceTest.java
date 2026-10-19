package com.smartagrirent.monitoring;

import com.smartagrirent.monitoring.dto.response.PlotSensorSummaryResponse;
import com.smartagrirent.monitoring.dto.response.SensorReadingResponse;
import com.smartagrirent.monitoring.entity.SensorReading;
import com.smartagrirent.monitoring.repository.SensorReadingRepository;
import com.smartagrirent.monitoring.service.SensorSimulationService;
import com.smartagrirent.monitoring.service.SensorSseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SensorSimulationServiceTest {

    @Mock
    private SensorReadingRepository readingRepository;

    @Mock
    private SensorSseService sseService;

    @InjectMocks
    private SensorSimulationService simulationService;

    private SensorReading sampleReading;

    @BeforeEach
    void setUp() {
        sampleReading = SensorReading.builder()
                .readingId(1L)
                .plotId(1)
                .temperature(BigDecimal.valueOf(28.50))
                .airHumidity(BigDecimal.valueOf(70.00))
                .soilHumidity(BigDecimal.valueOf(65.00))
                .recordedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Kiểm tra sinh dữ liệu mới nằm trong khoảng vi khí hậu an toàn")
    void testGenerateNextReading_ValuesWithinSafeRanges() {
        when(readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(1))
                .thenReturn(Optional.of(sampleReading));

        SensorReading next = simulationService.generateNextReading(1);

        assertNotNull(next);
        assertEquals(1, next.getPlotId());
        assertTrue(next.getTemperature().doubleValue() >= 20.0 && next.getTemperature().doubleValue() <= 40.0,
                "Nhiệt độ phải nằm trong khoảng cho phép");
        assertTrue(next.getAirHumidity().doubleValue() >= 40.0 && next.getAirHumidity().doubleValue() <= 95.0,
                "Độ ẩm không khí phải hợp lệ");
        assertTrue(next.getSoilHumidity().doubleValue() >= 35.0 && next.getSoilHumidity().doubleValue() <= 90.0,
                "Độ ẩm đất phải hợp lệ");
    }

    @Test
    @DisplayName("Kiểm tra phân loại trạng thái cảnh báo theo độ ẩm đất")
    void testSensorStatusClassification() {
        // Test OPTIMAL
        SensorReading optimal = SensorReading.builder()
                .temperature(BigDecimal.valueOf(27.0))
                .airHumidity(BigDecimal.valueOf(70.0))
                .soilHumidity(BigDecimal.valueOf(60.0))
                .build();
        SensorReadingResponse respOptimal = SensorReadingResponse.fromEntity(optimal);
        assertEquals("OPTIMAL", respOptimal.getStatus());

        // Test LOW SOIL MOISTURE (< 45%)
        SensorReading lowMoisture = SensorReading.builder()
                .temperature(BigDecimal.valueOf(32.0))
                .airHumidity(BigDecimal.valueOf(60.0))
                .soilHumidity(BigDecimal.valueOf(38.0))
                .build();
        SensorReadingResponse respLow = SensorReadingResponse.fromEntity(lowMoisture);
        assertEquals("WARNING_LOW_SOIL_MOISTURE", respLow.getStatus());

        // Test HIGH SOIL MOISTURE (> 80%)
        SensorReading highMoisture = SensorReading.builder()
                .temperature(BigDecimal.valueOf(25.0))
                .airHumidity(BigDecimal.valueOf(85.0))
                .soilHumidity(BigDecimal.valueOf(85.0))
                .build();
        SensorReadingResponse respHigh = SensorReadingResponse.fromEntity(highMoisture);
        assertEquals("WARNING_HIGH_SOIL_MOISTURE", respHigh.getStatus());
    }

    @Test
    @DisplayName("Kiểm tra kích hoạt mock thủ công và phát tín hiệu SSE")
    void testTriggerManualMock_SavesAndBroadcasts() {
        when(readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(1))
                .thenReturn(Optional.of(sampleReading));
        when(readingRepository.save(any(SensorReading.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        SensorReadingResponse response = simulationService.triggerManualMock(1);

        assertNotNull(response);
        assertEquals(1, response.getPlotId());
        verify(readingRepository, times(1)).save(any(SensorReading.class));
        verify(sseService, times(1)).broadcastReading(any(SensorReadingResponse.class));
    }

    @Test
    @DisplayName("Kiểm tra lấy tóm tắt chỉ số trung bình của thửa đất")
    void testGetPlotSummary() {
        when(readingRepository.findFirstByPlotIdOrderByRecordedAtDesc(1))
                .thenReturn(Optional.of(sampleReading));
        when(readingRepository.findAvgTemperature(eq(1), any(Instant.class)))
                .thenReturn(28.5);
        when(readingRepository.findAvgAirHumidity(eq(1), any(Instant.class)))
                .thenReturn(70.0);
        when(readingRepository.findAvgSoilHumidity(eq(1), any(Instant.class)))
                .thenReturn(65.0);
        when(readingRepository.findByPlotIdAndRecordedAtAfterOrderByRecordedAtAsc(eq(1), any(Instant.class)))
                .thenReturn(List.of(sampleReading));

        PlotSensorSummaryResponse summary = simulationService.getPlotSummary(1);

        assertNotNull(summary);
        assertEquals(1, summary.getPlotId());
        assertEquals(28.5, summary.getAvgTemperature());
        assertEquals(70.0, summary.getAvgAirHumidity());
        assertEquals(65.0, summary.getAvgSoilHumidity());
        assertEquals(1, summary.getTotalReadings24h());
    }
}
