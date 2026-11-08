package com.farmely.farm.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarietySummaryResponse {

    private Integer varietyId;
    private Integer cropId;
    private String cropName;
    private String varietyName;
    private Integer expectedDuration;
    private Integer bufferTime;
}
