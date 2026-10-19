package com.smartagrirent.farm.service;

import com.smartagrirent.farm.constant.PlotStatus;
import com.smartagrirent.farm.dto.request.CreatePlotRequest;
import com.smartagrirent.farm.dto.response.PlotResponse;

import java.util.List;

public interface PlotService {

    List<PlotResponse> getAllPlots(Integer landId, PlotStatus status, Boolean publishedOnly);

    PlotResponse getPlotById(Integer plotId);

    PlotResponse getPlotByCode(String plotCode);

    PlotResponse createPlot(CreatePlotRequest request);

    PlotResponse updatePlotStatus(Integer plotId, PlotStatus newStatus);

    PlotResponse togglePublish(Integer plotId, Boolean published);
}
