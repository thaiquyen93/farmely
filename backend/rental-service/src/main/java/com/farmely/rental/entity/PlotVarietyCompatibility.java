package com.farmely.rental.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "plot_variety_compatibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PlotVarietyCompatibility.PlotVarietyCompatibilityId.class)
public class PlotVarietyCompatibility {

    @Id
    @Column(name = "plot_id")
    private Integer plotId;

    @Id
    @Column(name = "variety_id")
    private Integer varietyId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class PlotVarietyCompatibilityId implements Serializable {
        private Integer plotId;
        private Integer varietyId;
    }
}
