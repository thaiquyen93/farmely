package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTemplateStepRequest {

    @NotNull(message = "Thứ tự bước (stepOrder) không được để trống")
    private Integer stepOrder;

    @NotBlank(message = "Tên bước (stepName) không được để trống")
    private String stepName;

    @NotNull(message = "Số ngày kể từ gieo trồng (dayOffset) không được để trống")
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
