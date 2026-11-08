package com.farmely.cultivation.dto.request;

import com.farmely.cultivation.entity.DeliveryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordHarvestRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    @NotNull(message = "Mã công nhân ghi nhận (enteredBy) không được để trống")
    private Integer enteredBy;

    private LocalDate harvestDate;

    @NotNull(message = "Sản lượng thu hoạch không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Sản lượng thu hoạch phải lớn hơn 0")
    private BigDecimal yieldAmount;

    private String evidenceImageUrl;

    @NotNull(message = "Hình thức giao nhận không được để trống (PICKUP hoặc DELIVERY)")
    private DeliveryType deliveryType;
}
