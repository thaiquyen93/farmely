package com.farmely.farm.service.impl;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.dto.*;
import com.farmely.farm.entity.*;
import com.farmely.farm.exception.BadRequestException;
import com.farmely.farm.exception.ConflictException;
import com.farmely.farm.exception.ResourceNotFoundException;
import com.farmely.farm.geo.BoundaryCodec;
import com.farmely.farm.geo.BoundaryRules;
import com.farmely.farm.geo.PolygonGeometry;
import com.farmely.farm.repository.*;
import com.farmely.farm.service.PlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlotServiceImpl implements PlotService {

    private final PlotRepository plotRepository;
    private final LandRepository landRepository;
    private final PlotVarietyCompatibilityRepository compatibilityRepository;
    private final VarietyReferenceRepository varietyRepository;
    private final BoundaryRules boundaryRules;

    @Override
    @Transactional(readOnly = true)
    public List<PlotResponse> getAllPlots(PlotFilterCriteria criteria) {
        if (criteria == null) {
            criteria = new PlotFilterCriteria();
        }

        List<PlotEntity> plots = plotRepository.findAll(PlotSpecifications.withCriteria(criteria));
        return plots.stream().map(this::toPlotResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlotResponse> getMarketplacePlots(Integer landId, Integer cropId, BigDecimal minArea, BigDecimal maxArea, BigDecimal maxPrice) {
        log.info("Lấy danh sách thửa đất Marketplace: landId={}, cropId={}, minArea={}, maxArea={}, maxPrice={}",
                landId, cropId, minArea, maxArea, maxPrice);

        List<PlotEntity> plots = plotRepository.findAll(PlotSpecifications.marketplace(landId, cropId, minArea, maxArea, maxPrice));
        return plots.stream().map(this::toPlotResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlotResponse getPlotById(Integer plotId) {
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));
        return toPlotResponse(plot);
    }

    @Override
    @Transactional(readOnly = true)
    public PlotResponse getPlotByCode(String plotCode) {
        PlotEntity plot = plotRepository.findByPlotCode(plotCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với mã: " + plotCode));
        return toPlotResponse(plot);
    }

    @Override
    @Transactional
    public PlotResponse createPlot(PlotCreateRequest request) {
        log.info("Tạo thửa đất mới mã: {}, thuộc nông trại ID: {}", request.getPlotCode(), request.getLandId());

        if (plotRepository.existsByPlotCode(request.getPlotCode().trim())) {
            throw new ConflictException("Mã thửa đất đã được sử dụng: " + request.getPlotCode());
        }

        LandEntity land = landRepository.findById(request.getLandId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nông trại với ID: " + request.getLandId()));

        // Có ranh giới -> kiểm tra nằm trong nông trại, không chồng lấn, và tự tính diện tích
        List<double[]> ring = hasRing(request.getBoundary()) ? boundaryRules.parse(request.getBoundary()) : null;
        if (ring != null) {
            boundaryRules.checkPlotFits(land, null, ring);
        }

        PlotEntity plot = PlotEntity.builder()
                .landId(land.getLandId())
                .plotCode(request.getPlotCode().trim().toUpperCase())
                .area(resolveArea(request.getArea(), ring))
                .boundaryGeojson(ring != null ? BoundaryCodec.toGeoJson(ring) : null)
                .imageUrl(request.getImageUrl())
                .pricePerPeriod(request.getPricePerPeriod())
                .status(request.getStatus() != null ? request.getStatus() : PlotStatus.AVAIL)
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .build();

        PlotEntity saved = plotRepository.save(plot);

        if (request.getCompatibleVarietyIds() != null && !request.getCompatibleVarietyIds().isEmpty()) {
            saveCompatibilities(saved.getPlotId(), request.getCompatibleVarietyIds());
        }

        return toPlotResponse(saved);
    }

    @Override
    @Transactional
    public PlotResponse updatePlot(Integer plotId, PlotUpdateRequest request) {
        log.info("Cập nhật thông tin thửa đất ID: {}", plotId);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        if (plotRepository.existsByPlotCodeAndPlotIdNot(request.getPlotCode().trim(), plotId)) {
            throw new ConflictException("Mã thửa đất đã được sử dụng bởi thửa khác: " + request.getPlotCode());
        }

        LandEntity land = landRepository.findById(request.getLandId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nông trại với ID: " + request.getLandId()));

        // null = giữ nguyên ranh giới; [] = xoá; có đỉnh = vẽ lại
        boolean landChanged = !land.getLandId().equals(plot.getLandId());
        List<double[]> ring;
        if (request.getBoundary() == null) {
            ring = BoundaryCodec.fromGeoJson(plot.getBoundaryGeojson());
        } else {
            ring = request.getBoundary().isEmpty() ? null : boundaryRules.parse(request.getBoundary());
            boolean boundaryChanged = !java.util.Objects.equals(
                    ring == null ? null : BoundaryCodec.toGeoJson(ring), plot.getBoundaryGeojson());
            if (boundaryChanged && plot.getStatus() == PlotStatus.RENT) {
                throw new BadRequestException("Không thể sửa ranh giới thửa " + plot.getPlotCode()
                        + " khi đang có khách thuê — diện tích trong hợp đồng sẽ không còn khớp.");
            }
        }
        if (ring != null && (landChanged || request.getBoundary() != null)) {
            boundaryRules.checkPlotFits(land, plotId, ring);
        }

        plot.setLandId(land.getLandId());
        plot.setPlotCode(request.getPlotCode().trim().toUpperCase());
        plot.setBoundaryGeojson(ring != null ? BoundaryCodec.toGeoJson(ring) : null);
        plot.setArea(resolveArea(request.getArea() != null ? request.getArea() : plot.getArea(), ring));
        plot.setImageUrl(request.getImageUrl());
        plot.setPricePerPeriod(request.getPricePerPeriod());
        if (request.getStatus() != null) {
            plot.setStatus(request.getStatus());
        }
        if (request.getIsPublished() != null) {
            plot.setIsPublished(request.getIsPublished());
        }

        PlotEntity updated = plotRepository.save(plot);

        if (request.getCompatibleVarietyIds() != null) {
            compatibilityRepository.deleteByPlotId(plotId);
            saveCompatibilities(plotId, request.getCompatibleVarietyIds());
        }

        return toPlotResponse(updated);
    }

    @Override
    @Transactional
    public PlotResponse updatePlotStatus(Integer plotId, PlotStatus status) {
        log.info("Cập nhật trạng thái thửa đất ID: {} thành {}", plotId, status);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        plot.setStatus(status);
        PlotEntity updated = plotRepository.save(plot);
        return toPlotResponse(updated);
    }

    @Override
    @Transactional
    public PlotResponse updatePlotPublish(Integer plotId, Boolean isPublished) {
        log.info("Cập nhật trạng thái xuất bản thửa đất ID: {} thành {}", plotId, isPublished);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        plot.setIsPublished(isPublished);
        PlotEntity updated = plotRepository.save(plot);
        return toPlotResponse(updated);
    }

    @Override
    @Transactional
    public void deletePlot(Integer plotId) {
        log.info("Xóa thửa đất ID: {}", plotId);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        if (plot.getStatus() == PlotStatus.RENT) {
            throw new BadRequestException("Không thể xóa thửa đất đang có trạng thái được thuê (RENT)!");
        }

        compatibilityRepository.deleteByPlotId(plotId);
        plotRepository.delete(plot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VarietySummaryResponse> getCompatibleVarieties(Integer plotId) {
        if (!plotRepository.existsById(plotId)) {
            throw new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId);
        }

        List<PlotVarietyCompatibilityEntity> compatibilities = compatibilityRepository.findByIdPlotId(plotId);
        return compatibilities.stream()
                .map(c -> {
                    VarietyReferenceEntity v = varietyRepository.findById(c.getId().getVarietyId()).orElse(null);
                    if (v == null) return null;
                    return VarietySummaryResponse.builder()
                            .varietyId(v.getVarietyId())
                            .cropId(v.getCropId())
                            .cropName(v.getCrop() != null ? v.getCrop().getCropName() : null)
                            .varietyName(v.getVarietyName())
                            .expectedDuration(v.getExpectedDuration())
                            .bufferTime(v.getBufferTime())
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<VarietySummaryResponse> updatePlotCompatibility(Integer plotId, List<Integer> varietyIds) {
        log.info("Cập nhật danh sách giống cây tương thích cho thửa đất ID: {}", plotId);
        if (!plotRepository.existsById(plotId)) {
            throw new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId);
        }

        compatibilityRepository.deleteByPlotId(plotId);
        if (varietyIds != null && !varietyIds.isEmpty()) {
            saveCompatibilities(plotId, varietyIds);
        }

        return getCompatibleVarieties(plotId);
    }

    @Override
    @Transactional
    public PlotResponse startSoilMaintenance(Integer plotId) {
        log.info("Bắt đầu chu kỳ nghỉ đất 4 ngày (MAINT) cho thửa đất ID: {}", plotId);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        plot.setStatus(PlotStatus.MAINT);
        plot.setIsPublished(false); // Tuyệt đối ẩn khỏi Marketplace theo BR02, BR07, BR21
        PlotEntity updated = plotRepository.save(plot);
        return toPlotResponse(updated);
    }

    @Override
    @Transactional
    public PlotResponse completeSoilMaintenance(Integer plotId) {
        log.info("Hoàn tất chu kỳ nghỉ đất, mở lại thửa đất ID: {} sang AVAILABLE", plotId);
        PlotEntity plot = plotRepository.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + plotId));

        plot.setStatus(PlotStatus.AVAIL);
        PlotEntity updated = plotRepository.save(plot);
        return toPlotResponse(updated);
    }

    private void saveCompatibilities(Integer plotId, List<Integer> varietyIds) {
        List<PlotVarietyCompatibilityEntity> entities = new ArrayList<>();
        for (Integer varietyId : varietyIds) {
            if (varietyRepository.existsById(varietyId)) {
                PlotVarietyCompatibilityId id = PlotVarietyCompatibilityId.builder()
                        .plotId(plotId)
                        .varietyId(varietyId)
                        .build();
                entities.add(PlotVarietyCompatibilityEntity.builder().id(id).build());
            }
        }
        if (!entities.isEmpty()) {
            compatibilityRepository.saveAll(entities);
        }
    }

    private static boolean hasRing(List<List<Double>> boundary) {
        return boundary != null && !boundary.isEmpty();
    }

    /** Có ranh giới thì diện tích lấy từ đa giác; không thì bắt buộc client gửi diện tích. */
    private static BigDecimal resolveArea(BigDecimal requested, List<double[]> ring) {
        if (ring != null) {
            return BigDecimal.valueOf(PolygonGeometry.areaM2(ring)).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        if (requested == null) {
            throw new BadRequestException("Cần nhập diện tích hoặc vẽ ranh giới thửa đất trên bản đồ.");
        }
        return requested;
    }

    private PlotResponse toPlotResponse(PlotEntity plot) {
        LandEntity land = plot.getLand() != null ? plot.getLand() : landRepository.findById(plot.getLandId()).orElse(null);
        List<VarietySummaryResponse> compatibleVarieties = getCompatibleVarietiesSafe(plot.getPlotId());

        return PlotResponse.builder()
                .plotId(plot.getPlotId())
                .landId(plot.getLandId())
                .landName(land != null ? land.getLandName() : null)
                .landAddress(land != null ? land.getAddress() : null)
                .plotCode(plot.getPlotCode())
                .area(plot.getArea())
                .imageUrl(plot.getImageUrl())
                .boundary(BoundaryCodec.toApi(plot.getBoundaryGeojson()))
                .pricePerPeriod(plot.getPricePerPeriod())
                .status(plot.getStatus())
                .isPublished(plot.getIsPublished())
                .createdAt(plot.getCreatedAt())
                .updatedAt(plot.getUpdatedAt())
                .compatibleVarieties(compatibleVarieties)
                .build();
    }

    private List<VarietySummaryResponse> getCompatibleVarietiesSafe(Integer plotId) {
        try {
            List<PlotVarietyCompatibilityEntity> compatibilities = compatibilityRepository.findByIdPlotId(plotId);
            return compatibilities.stream()
                    .map(c -> {
                        VarietyReferenceEntity v = varietyRepository.findById(c.getId().getVarietyId()).orElse(null);
                        if (v == null) return null;
                        return VarietySummaryResponse.builder()
                                .varietyId(v.getVarietyId())
                                .cropId(v.getCropId())
                                .cropName(v.getCrop() != null ? v.getCrop().getCropName() : null)
                                .varietyName(v.getVarietyName())
                                .expectedDuration(v.getExpectedDuration())
                                .bufferTime(v.getBufferTime())
                                .build();
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
