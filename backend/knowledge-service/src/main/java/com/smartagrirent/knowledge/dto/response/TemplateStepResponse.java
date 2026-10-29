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
    private Integer durationDays;
    private String taskType;
    private String description;
    private String waterRegime;
    private String nutritionRegime;
    private String pestWarning;
    private String materialsNeeded;
    private String evidenceRequirement;
    private String inspectionCriteria;
    private Double minTemp;
    private Double maxTemp;
    private Double minHumidity;
    private Double maxHumidity;
}
