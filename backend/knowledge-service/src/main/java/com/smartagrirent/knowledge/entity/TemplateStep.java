package com.smartagrirent.knowledge.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "template_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "step_id")
    private Integer stepId;

    @Column(name = "template_id", nullable = false)
    private Integer templateId;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "step_name", nullable = false, length = 150)
    private String stepName;

    @Column(name = "day_offset", nullable = false)
    private Integer dayOffset;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "materials_needed", columnDefinition = "TEXT")
    private String materialsNeeded;

    @Column(name = "task_type", length = 50)
    private String taskType;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "water_regime", columnDefinition = "TEXT")
    private String waterRegime;

    @Column(name = "nutrition_regime", columnDefinition = "TEXT")
    private String nutritionRegime;

    @Column(name = "pest_warning", columnDefinition = "TEXT")
    private String pestWarning;

    @Column(name = "evidence_requirement", columnDefinition = "TEXT")
    private String evidenceRequirement;

    @Column(name = "inspection_criteria", columnDefinition = "TEXT")
    private String inspectionCriteria;

    @Column(name = "min_temp")
    private Double minTemp;

    @Column(name = "max_temp")
    private Double maxTemp;

    @Column(name = "min_humidity")
    private Double minHumidity;

    @Column(name = "max_humidity")
    private Double maxHumidity;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", insertable = false, updatable = false)
    private ProcessTemplate template;
}
