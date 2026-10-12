package com.smartagrirent.farm.dto.response;

import com.smartagrirent.farm.constant.PlotStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotResponse {

    private Integer plotId;
    private Integer landId;
    private String landName;
    private String plotCode;
    private BigDecimal area;
    private String imageUrl;
    private BigDecimal pricePerPeriod;
    private PlotStatus status;
    private Boolean isPublished;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
