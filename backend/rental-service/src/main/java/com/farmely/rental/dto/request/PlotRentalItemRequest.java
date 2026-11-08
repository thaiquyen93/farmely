package com.farmely.rental.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotRentalItemRequest {

    @NotNull(message = "Mã thửa đất (plotId) không được để trống")
    private Integer plotId;

    @NotNull(message = "Mã giống rau (varietyId) không được để trống")
    private Integer varietyId;

    /**
     * NULL = Tự chăm sóc (Self-growing)
     * Có ID (ví dụ gói S15) = Chăm sóc trọn gói (Assisted-growing)
     */
    private Integer serviceId;

    @NotNull(message = "Ngày bắt đầu (startDate) không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc (endDate) không được để trống")
    private LocalDate endDate;
}
