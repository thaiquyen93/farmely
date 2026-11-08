package com.farmely.cultivation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "template_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateStepReference {

    @Id
    @Column(name = "step_id")
    private Integer stepId;

    @Column(name = "template_id")
    private Integer templateId;

    @Column(name = "step_name")
    private String stepName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "day_offset")
    private Integer dayOffset;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "task_type")
    private String taskType;

    @Column(name = "min_temp")
    private BigDecimal minTemp;

    @Column(name = "max_temp")
    private BigDecimal maxTemp;

    @Column(name = "min_humidity")
    private BigDecimal minHumidity;

    @Column(name = "max_humidity")
    private BigDecimal maxHumidity;
}
