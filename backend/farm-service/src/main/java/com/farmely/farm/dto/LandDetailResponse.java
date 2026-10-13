package com.farmely.farm.dto;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandDetailResponse {

    private Integer landId;
    private String landName;
    private String address;
    private String description;
    private List<List<Double>> boundary;
    private Double boundaryAreaM2;
    private Long totalPlots;
    private Long availablePlots;
    private Long rentedPlots;
    private Long maintenancePlots;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<PlotSummaryResponse> plots;
}
