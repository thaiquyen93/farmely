package com.farmely.cultivation.dto.response;

import com.farmely.cultivation.entity.RequestStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequestResponse {

    private Integer requestId;
    private Integer rentalId;
    private ServiceResponse service;
    private LocalDate scheduledDate;
    private RequestStatus status;
    private OffsetDateTime createdAt;

    // Helper display fields for UI
    private String plotCode;
    private String plotName;
    private String varietyName;
    private String renterName;
}
