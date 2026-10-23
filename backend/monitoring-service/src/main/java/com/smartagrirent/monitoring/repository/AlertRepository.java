package com.smartagrirent.monitoring.repository;

import com.smartagrirent.monitoring.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findAllByOrderByDetectedAtDesc();

    List<Alert> findByPlotIdOrderByDetectedAtDesc(Integer plotId);

    List<Alert> findByStatusOrderByDetectedAtDesc(String status);

    List<Alert> findBySeverityOrderByDetectedAtDesc(String severity);

    long countByStatus(String status);

    long countBySeverityAndStatus(String severity, String status);

    Optional<Alert> findFirstByPlotIdAndAlertTypeAndStatus(Integer plotId, String alertType, String status);

    List<Alert> findByStatusAndDetectedAtAfter(String status, Instant since);
}
