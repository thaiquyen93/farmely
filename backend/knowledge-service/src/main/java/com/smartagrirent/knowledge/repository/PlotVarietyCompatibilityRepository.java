package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.PlotVarietyCompatibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlotVarietyCompatibilityRepository extends JpaRepository<PlotVarietyCompatibility, PlotVarietyCompatibility.PlotVarietyCompatibilityId> {
    List<PlotVarietyCompatibility> findByIdPlotId(Integer plotId);
    List<PlotVarietyCompatibility> findByIdVarietyId(Integer varietyId);
}
