package com.farmely.farm.dto;

import com.farmely.farm.constant.PlotStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotResponse {

    private Integer plotId;
    private Integer landId;
    private String landName;
    private String landAddress;
    private String plotCode;
    private BigDecimal area;
    private String imageUrl;
    /** Ranh giới (ring mở [lng, lat]) hoặc null */
    private List<List<Double>> boundary;
    private BigDecimal pricePerPeriod;
    private PlotStatus status;
    private Boolean isPublished;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<VarietySummaryResponse> compatibleVarieties;
}
