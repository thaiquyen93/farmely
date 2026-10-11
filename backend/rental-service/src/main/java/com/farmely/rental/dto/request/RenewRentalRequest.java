package com.farmely.rental.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewRentalRequest {

    /**
     * Ngày kết thúc mới sau khi gia hạn
     */
    @NotNull(message = "Ngày kết thúc mới (newEndDate) không được để trống")
    private LocalDate newEndDate;

    /**
     * Có thể đổi giống rau khi gia hạn mùa vụ mới
     */
    private Integer newVarietyId;

    /**
     * Có thể đổi hình thức dịch vụ (NULL = Self, có ID = Assisted)
     */
    private Integer newServiceId;
}
