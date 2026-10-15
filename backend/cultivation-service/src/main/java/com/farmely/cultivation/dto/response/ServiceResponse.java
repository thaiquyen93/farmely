package com.farmely.cultivation.dto.response;

import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceResponse {

    private Integer serviceId;
    private String serviceCode;
    private String serviceName;
    private ServiceType serviceType;
    private BigDecimal price;
    private String unit;
    private String description;
    private ActiveStatus status;
}
