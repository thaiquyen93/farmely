package com.smartagrirent.farm.service.impl;

import com.smartagrirent.farm.constant.PlotStatus;
import com.smartagrirent.farm.dto.request.CreatePlotRequest;
import com.smartagrirent.farm.dto.response.PlotResponse;
import com.smartagrirent.farm.entity.Land;
import com.smartagrirent.farm.entity.Plot;
import com.smartagrirent.farm.repository.LandRepository;
import com.smartagrirent.farm.repository.PlotRepository;
import com.smartagrirent.farm.service.PlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlotServiceImpl implements PlotService {

    private final PlotRepository plotRepository;
    private final LandRepository landRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PlotResponse> getAllPlots(Integer landId, PlotStatus status, Boolean publishedOnly) {
        List<Plot> plots = plotRepository.findAll();

        if (landId != null) {
            plots = plots.stream().filter(p -> landId.equals(p.getLandId())).collect(Collectors.toList());
        }
        if (status != null) {
            plots = plots.stream().filter(p -> status.equals(p.getStatus())).collect(Collectors.toList());
        }
        if (Boolean.TRUE.equals(publishedOnly)) {
            plots = plots.stream().filter(p -> Boolean.TRUE.equals(p.getIsPublished())).collect(Collectors.toList());
        }

        Map<Integer, String> landNameMap = landRepository.findAll().stream()
                .collect(Collectors.toMap(Land::getLandId, Land::getLandName, (a, b) -> a));

        return plots.stream()
                .map(p -> mapToResponse(p, landNameMap.get(p.getLandId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlotResponse getPlotById(Integer plotId) {
        Plot plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thửa đất với ID: " + plotId));
        String landName = landRepository.findById(plot.getLandId())
                .map(Land::getLandName).orElse("N/A");
        return mapToResponse(plot, landName);
    }

    @Override
    @Transactional(readOnly = true)
    public PlotResponse getPlotByCode(String plotCode) {
        Plot plot = plotRepository.findByPlotCode(plotCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thửa đất với mã: " + plotCode));
        String landName = landRepository.findById(plot.getLandId())
                .map(Land::getLandName).orElse("N/A");
        return mapToResponse(plot, landName);
    }

    @Override
    @Transactional
    public PlotResponse createPlot(CreatePlotRequest request) {
        if (!landRepository.existsById(request.getLandId())) {
            throw new IllegalArgumentException("Không tìm thấy khu đất cha ID: " + request.getLandId());
        }
        if (plotRepository.findByPlotCode(request.getPlotCode()).isPresent()) {
            throw new IllegalArgumentException("Mã thửa đất đã tồn tại: " + request.getPlotCode());
        }

        Plot plot = Plot.builder()
                .landId(request.getLandId())
                .plotCode(request.getPlotCode().trim())
                .area(request.getArea())
                .imageUrl(request.getImageUrl())
                .pricePerPeriod(request.getPricePerPeriod())
                .status(request.getStatus() != null ? request.getStatus() : PlotStatus.AVAIL)
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : true)
                .build();

        Plot saved = plotRepository.save(plot);
        log.info("Đã tạo mới thửa đất: {} (ID: {})", saved.getPlotCode(), saved.getPlotId());
        String landName = landRepository.findById(saved.getLandId())
                .map(Land::getLandName).orElse("N/A");
        return mapToResponse(saved, landName);
    }

    @Override
    @Transactional
    public PlotResponse updatePlotStatus(Integer plotId, PlotStatus newStatus) {
        Plot plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thửa đất với ID: " + plotId));
        
        PlotStatus oldStatus = plot.getStatus();
        plot.setStatus(newStatus);
        Plot saved = plotRepository.save(plot);
        log.info("Cập nhật trạng thái thửa đất #{}: {} -> {}", plotId, oldStatus, newStatus);
        
        String landName = landRepository.findById(saved.getLandId())
                .map(Land::getLandName).orElse("N/A");
        return mapToResponse(saved, landName);
    }

    @Override
    @Transactional
    public PlotResponse togglePublish(Integer plotId, Boolean published) {
        Plot plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thửa đất với ID: " + plotId));
        plot.setIsPublished(published != null ? published : !Boolean.TRUE.equals(plot.getIsPublished()));
        Plot saved = plotRepository.save(plot);
        log.info("Cập nhật trạng thái hiển thị thửa đất #{}: {}", plotId, saved.getIsPublished());

        String landName = landRepository.findById(saved.getLandId())
                .map(Land::getLandName).orElse("N/A");
        return mapToResponse(saved, landName);
    }

    private PlotResponse mapToResponse(Plot plot, String landName) {
        return PlotResponse.builder()
                .plotId(plot.getPlotId())
                .landId(plot.getLandId())
                .landName(landName != null ? landName : "Trang trại Farmely")
                .plotCode(plot.getPlotCode())
                .area(plot.getArea())
                .imageUrl(plot.getImageUrl())
                .pricePerPeriod(plot.getPricePerPeriod())
                .status(plot.getStatus())
                .isPublished(plot.getIsPublished())
                .createdAt(plot.getCreatedAt())
                .updatedAt(plot.getUpdatedAt())
                .build();
    }
}
