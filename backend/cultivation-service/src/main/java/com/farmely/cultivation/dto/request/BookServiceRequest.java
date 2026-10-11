package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookServiceRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    @NotNull(message = "Mã dịch vụ (serviceId) không được để trống")
    private Integer serviceId;

    private LocalDate scheduledDate;

    private String notes;
}
