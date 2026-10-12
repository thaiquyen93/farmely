package com.farmely.farm.dto;

import com.farmely.farm.constant.VisitSlot;
import com.farmely.farm.constant.VisitStatus;
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
    private Integer landId;
    private String landName;
    private String visitorName;
    private String visitorPhone;
    private LocalDate visitDate;
    private VisitSlot visitSlot;
    private VisitStatus status;
    private OffsetDateTime createdAt;
}
