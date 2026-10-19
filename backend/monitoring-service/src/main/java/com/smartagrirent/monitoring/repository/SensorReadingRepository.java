package com.smartagrirent.monitoring.repository;

import com.smartagrirent.monitoring.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    Optional<SensorReading> findFirstByPlotIdOrderByRecordedAtDesc(Integer plotId);

    List<SensorReading> findTop50ByPlotIdOrderByRecordedAtDesc(Integer plotId);

    List<SensorReading> findByPlotIdAndRecordedAtAfterOrderByRecordedAtAsc(Integer plotId, Instant since);

    long countByPlotId(Integer plotId);

    @Query("SELECT DISTINCT s.plotId FROM SensorReading s")
    List<Integer> findDistinctPlotIds();

    @Query("SELECT AVG(s.temperature) FROM SensorReading s WHERE s.plotId = :plotId AND s.recordedAt >= :since")
    Double findAvgTemperature(@Param("plotId") Integer plotId, @Param("since") Instant since);

    @Query("SELECT AVG(s.airHumidity) FROM SensorReading s WHERE s.plotId = :plotId AND s.recordedAt >= :since")
    Double findAvgAirHumidity(@Param("plotId") Integer plotId, @Param("since") Instant since);

    @Query("SELECT AVG(s.soilHumidity) FROM SensorReading s WHERE s.plotId = :plotId AND s.recordedAt >= :since")
    Double findAvgSoilHumidity(@Param("plotId") Integer plotId, @Param("since") Instant since);
}
