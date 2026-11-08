package com.farmely.farm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotVarietyCompatibilityId implements Serializable {

    @Column(name = "plot_id")
    private Integer plotId;

    @Column(name = "variety_id")
    private Integer varietyId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PlotVarietyCompatibilityId that = (PlotVarietyCompatibilityId) o;
        return Objects.equals(plotId, that.plotId) && Objects.equals(varietyId, that.varietyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(plotId, varietyId);
    }
}
