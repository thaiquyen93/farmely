package com.smartagrirent.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "plot_variety_compatibility")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlotVarietyCompatibility {

    @EmbeddedId
    private PlotVarietyCompatibilityId id;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlotVarietyCompatibilityId implements Serializable {
        @Column(name = "plot_id")
        private Integer plotId;

        @Column(name = "variety_id")
        private Integer varietyId;
    }
}
