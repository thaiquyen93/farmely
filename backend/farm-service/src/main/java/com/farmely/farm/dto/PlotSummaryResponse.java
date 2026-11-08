package com.farmely.farm.dto;

import com.farmely.farm.constant.PlotStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotSummaryResponse {

    private Integer plotId;
    private Integer landId;
    private String plotCode;
    private BigDecimal area;
    private BigDecimal pricePerPeriod;
    private PlotStatus status;
    private Boolean isPublished;
    private String imageUrl;
    private java.util.List<java.util.List<Double>> boundary;
}
