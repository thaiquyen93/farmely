package com.farmely.cultivation.dto.request;

import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateServiceRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String serviceName;

    @NotNull(message = "Loại dịch vụ không được để trống (FULL hoặc A_LA_CARTE)")
    private ServiceType serviceType;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá dịch vụ phải lớn hơn 0")
    private BigDecimal price;

    private String unit;

    private String description;

    @Builder.Default
    private ActiveStatus status = ActiveStatus.ACTIVE;
}
