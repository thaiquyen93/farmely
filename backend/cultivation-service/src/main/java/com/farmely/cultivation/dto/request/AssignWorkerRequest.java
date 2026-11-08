package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignWorkerRequest {

    @NotNull(message = "Mã nhân viên (workerId) không được để trống")
    private Integer workerId;

    private LocalDate scheduledDate;

    private String notes;
}
