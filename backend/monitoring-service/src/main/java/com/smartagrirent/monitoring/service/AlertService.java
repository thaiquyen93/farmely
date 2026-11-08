package com.smartagrirent.monitoring.service;

import com.smartagrirent.monitoring.dto.request.CreateAlertRequest;
import com.smartagrirent.monitoring.dto.response.AlertResponse;
import com.smartagrirent.monitoring.entity.SensorReading;

import java.util.List;
import java.util.Map;

public interface AlertService {

    List<AlertResponse> getAlerts(Integer plotId, String status, String severity);

    Map<String, Object> getAlertOverview();

    AlertResponse acknowledgeAlert(Long alertId, String acknowledgedBy);

    AlertResponse resolveAlert(Long alertId, String resolutionNotes, String resolvedBy);

    AlertResponse createAlert(CreateAlertRequest request);

    void evaluateThresholds(SensorReading reading);

    AlertResponse simulateAnomalyAlert(Integer plotId, String anomalyType);
}
