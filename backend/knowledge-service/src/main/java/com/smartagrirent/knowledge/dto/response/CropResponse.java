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
public class CropResponse {
    private Integer cropId;
    private String cropName;
    private OffsetDateTime createdAt;
}
