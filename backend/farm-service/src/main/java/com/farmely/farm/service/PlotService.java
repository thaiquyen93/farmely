package com.farmely.farm.service;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface PlotService {

    List<PlotResponse> getAllPlots(PlotFilterCriteria criteria);

    List<PlotResponse> getMarketplacePlots(Integer landId, Integer cropId, BigDecimal minArea, BigDecimal maxArea, BigDecimal maxPrice);

    PlotResponse getPlotById(Integer plotId);

    PlotResponse getPlotByCode(String plotCode);

    PlotResponse createPlot(PlotCreateRequest request);

    PlotResponse updatePlot(Integer plotId, PlotUpdateRequest request);

    PlotResponse updatePlotStatus(Integer plotId, PlotStatus status);

    PlotResponse updatePlotPublish(Integer plotId, Boolean isPublished);

    void deletePlot(Integer plotId);

    List<VarietySummaryResponse> getCompatibleVarieties(Integer plotId);

    List<VarietySummaryResponse> updatePlotCompatibility(Integer plotId, List<Integer> varietyIds);

    PlotResponse startSoilMaintenance(Integer plotId);

    PlotResponse completeSoilMaintenance(Integer plotId);
}
