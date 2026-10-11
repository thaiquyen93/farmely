package com.smartagrirent.knowledge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateStepResponse {
    private Integer stepId;
    private Integer templateId;
    private Integer stepOrder;
    private String stepName;
    private Integer dayOffset;
    private String description;
    private String materialsNeeded;
}
