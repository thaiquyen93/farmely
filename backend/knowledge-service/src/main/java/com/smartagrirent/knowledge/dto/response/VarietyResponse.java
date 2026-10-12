package com.smartagrirent.knowledge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VarietyResponse {
    private Integer varietyId;
    private Integer cropId;
    private String cropName;
    private String varietyName;
    private Integer expectedDuration;
    private Integer bufferTime;
    private OffsetDateTime createdAt;
}
