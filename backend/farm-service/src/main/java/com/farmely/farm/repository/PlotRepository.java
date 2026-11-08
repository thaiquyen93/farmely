package com.farmely.farm.repository;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.entity.PlotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlotRepository extends JpaRepository<PlotEntity, Integer>, JpaSpecificationExecutor<PlotEntity> {

    boolean existsByPlotCode(String plotCode);

    boolean existsByPlotCodeAndPlotIdNot(String plotCode, Integer plotId);

    Optional<PlotEntity> findByPlotCode(String plotCode);

    List<PlotEntity> findByLandId(Integer landId);

    List<PlotEntity> findByStatus(PlotStatus status);

    long countByLandId(Integer landId);

    long countByLandIdAndStatus(Integer landId, PlotStatus status);
}
