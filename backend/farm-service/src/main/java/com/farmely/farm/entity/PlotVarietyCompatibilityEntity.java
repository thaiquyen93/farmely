package com.farmely.farm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plot_variety_compatibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotVarietyCompatibilityEntity {

    @EmbeddedId
    private PlotVarietyCompatibilityId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plot_id", insertable = false, updatable = false)
    private PlotEntity plot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variety_id", insertable = false, updatable = false)
    private VarietyReferenceEntity variety;
}
