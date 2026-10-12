package com.farmely.rental.repository;

import com.farmely.rental.entity.PlotVarietyCompatibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlotVarietyCompatibilityRepository extends JpaRepository<PlotVarietyCompatibility, PlotVarietyCompatibility.PlotVarietyCompatibilityId> {

    boolean existsByPlotIdAndVarietyId(Integer plotId, Integer varietyId);

    List<PlotVarietyCompatibility> findByPlotId(Integer plotId);
}
