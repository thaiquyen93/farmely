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
    private String description;
    /** Ranh giới (ring mở [lng, lat]) hoặc null nếu chưa khoanh vùng */
    private java.util.List<java.util.List<Double>> boundary;
    /** Diện tích tính từ ranh giới (m²) hoặc null */
    private Double boundaryAreaM2;
    private Long totalPlots;
    private Long availablePlots;
    private Long rentedPlots;
    private Long maintenancePlots;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
