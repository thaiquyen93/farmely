package com.smartagrirent.farm.repository;

import com.smartagrirent.farm.constant.PlotStatus;
import com.smartagrirent.farm.entity.Plot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlotRepository extends JpaRepository<Plot, Integer>, JpaSpecificationExecutor<Plot> {

    Optional<Plot> findByPlotCode(String plotCode);

    List<Plot> findByLandId(Integer landId);

    List<Plot> findByStatus(PlotStatus status);

    List<Plot> findByIsPublishedTrue();

    List<Plot> findByLandIdAndIsPublishedTrue(Integer landId);

    List<Plot> findByStatusAndIsPublishedTrue(PlotStatus status);
}
