package com.farmely.farm.repository;

import com.farmely.farm.entity.PlotVarietyCompatibilityEntity;
import com.farmely.farm.entity.PlotVarietyCompatibilityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlotVarietyCompatibilityRepository extends JpaRepository<PlotVarietyCompatibilityEntity, PlotVarietyCompatibilityId> {

    List<PlotVarietyCompatibilityEntity> findByIdPlotId(Integer plotId);

    List<PlotVarietyCompatibilityEntity> findByIdVarietyId(Integer varietyId);

    boolean existsByIdPlotIdAndIdVarietyId(Integer plotId, Integer varietyId);

    @Modifying
    @Query("DELETE FROM PlotVarietyCompatibilityEntity pvc WHERE pvc.id.plotId = :plotId")
    void deleteByPlotId(@Param("plotId") Integer plotId);

    @Modifying
    @Query("DELETE FROM PlotVarietyCompatibilityEntity pvc WHERE pvc.id.plotId = :plotId AND pvc.id.varietyId = :varietyId")
    void deleteByPlotIdAndVarietyId(@Param("plotId") Integer plotId, @Param("varietyId") Integer varietyId);
}
