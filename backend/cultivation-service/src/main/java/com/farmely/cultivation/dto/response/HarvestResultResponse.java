package com.farmely.cultivation.dto.response;

import com.farmely.cultivation.entity.DeliveryType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HarvestResultResponse {

    private Integer harvestId;
    private String harvestCode; // e.g. HV-701
    private Integer rentalId;
    private Integer enteredBy;
    private String workerName;
    private LocalDate harvestDate;
    private BigDecimal yieldAmount;
    private String evidenceImageUrl;
    private DeliveryType deliveryType;
    private Boolean customerConfirmed;
    private OffsetDateTime createdAt;

    // UI contextual details
    private String plotCode;
    private String plotName;
    private String cropName;
    private String customerName;
}
