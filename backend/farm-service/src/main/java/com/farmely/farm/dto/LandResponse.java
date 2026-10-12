package com.farmely.farm.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandResponse {

    private Integer landId;
    private String landName;
    private String address;
    private Long totalPlots;
    private Long availablePlots;
    private Long rentedPlots;
    private Long maintenancePlots;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
