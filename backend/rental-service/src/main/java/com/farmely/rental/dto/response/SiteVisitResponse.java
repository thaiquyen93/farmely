package com.farmely.rental.dto.response;

import com.farmely.rental.entity.VisitSlot;
import com.farmely.rental.entity.VisitStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisitResponse {

    private Integer visitId;
    private Integer plotId;
    private String plotCode;
    private String plotName;

    private String visitorName;
    private String visitorPhone;

    private LocalDate visitDate;
    private VisitSlot visitSlot;
    private String slotTime; // "08:00 - 11:00" hoặc "14:00 - 17:00"

    private VisitStatus status;
    private OffsetDateTime createdAt;
}
