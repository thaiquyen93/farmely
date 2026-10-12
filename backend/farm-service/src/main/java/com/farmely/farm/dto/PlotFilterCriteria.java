package com.farmely.farm.dto;

import com.farmely.farm.constant.PlotStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotFilterCriteria {

    private Integer landId;
    private PlotStatus status;
    private Boolean isPublished;
    private Integer cropId;
    private Integer varietyId;
    private BigDecimal minArea;
    private BigDecimal maxArea;
    private BigDecimal maxPrice;
    private String search;
}
