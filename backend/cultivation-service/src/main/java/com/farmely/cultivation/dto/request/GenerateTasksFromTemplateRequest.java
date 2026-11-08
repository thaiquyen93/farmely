package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateTasksFromTemplateRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    private Integer templateId;

    private LocalDate startDate;

    private Integer defaultWorkerId;
}
