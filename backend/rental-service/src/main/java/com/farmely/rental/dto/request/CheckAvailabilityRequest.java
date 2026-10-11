package com.farmely.rental.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckAvailabilityRequest {

    @NotNull(message = "Mã thửa đất (plotId) không được để trống")
    private Integer plotId;

    @NotNull(message = "Mã giống rau (varietyId) không được để trống")
    private Integer varietyId;

    @NotNull(message = "Ngày bắt đầu (startDate) không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc (endDate) không được để trống")
    private LocalDate endDate;
}
