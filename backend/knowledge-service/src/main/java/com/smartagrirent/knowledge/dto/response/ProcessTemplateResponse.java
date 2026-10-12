package com.smartagrirent.knowledge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessTemplateResponse {
    private Integer templateId;
    private Integer varietyId;
    private String varietyName;
    private Integer ptCreatedBy;
    private String version;
    private OffsetDateTime createdAt;
    private List<TemplateStepResponse> steps;
}
