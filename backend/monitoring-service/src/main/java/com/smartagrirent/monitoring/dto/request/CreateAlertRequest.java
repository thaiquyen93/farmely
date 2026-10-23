package com.smartagrirent.monitoring.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAlertRequest {

    @NotNull(message = "ID thửa đất không được để trống")
    private Integer plotId;

    @NotBlank(message = "Loại cảnh báo không được để trống")
    private String alertType;

    private String severity; // INFO, WARNING, CRITICAL, EMERGENCY

    private String metricName;

    private BigDecimal actualValue;

    private BigDecimal thresholdValue;

    private String message;

    private String actionSuggested;
}
