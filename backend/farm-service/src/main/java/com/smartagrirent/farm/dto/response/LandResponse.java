package com.smartagrirent.farm.dto.response;

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
    private Integer totalPlots;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
