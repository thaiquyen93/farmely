package com.farmely.rental.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityCheckResponse {

    private boolean available;

    private Integer plotId;
    private String plotCode;
    private BigDecimal pricePerPeriod;

    private Integer varietyId;
    private String varietyName;
    private boolean compatible;

    private Integer minRequiredDays; // expectedDuration + bufferTime
    private Long requestedDays;

    private LocalDate startDate;
    private LocalDate endDate;

    private String message;
}
