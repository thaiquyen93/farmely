package com.farmely.farm.service.impl;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.dto.LandDetailResponse;
import com.farmely.farm.dto.LandRequest;
import com.farmely.farm.dto.LandResponse;
import com.farmely.farm.dto.PlotSummaryResponse;
import com.farmely.farm.entity.LandEntity;
import com.farmely.farm.entity.PlotEntity;
import com.farmely.farm.exception.BadRequestException;
import com.farmely.farm.exception.ConflictException;
import com.farmely.farm.exception.ResourceNotFoundException;
import com.farmely.farm.geo.BoundaryCodec;
import com.farmely.farm.geo.BoundaryRules;
import com.farmely.farm.repository.LandRepository;
import com.farmely.farm.repository.PlotRepository;
import com.farmely.farm.service.LandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LandServiceImpl implements LandService {

    private final LandRepository landRepository;
    private final PlotRepository plotRepository;
    private final BoundaryRules boundaryRules;

    @Override
    @Transactional(readOnly = true)
    public List<LandResponse> getAllLands(String search) {
        List<LandEntity> lands;
        if (search != null && !search.trim().isEmpty()) {
            lands = landRepository.searchLands(search.trim());
        } else {
            lands = landRepository.findAll();
        }

        return lands.stream().map(this::toLandResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LandDetailResponse getLandById(Integer landId) {
        LandEntity land = landRepository.findById(landId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nông trại với ID: " + landId));

        List<PlotEntity> plots = plotRepository.findByLandId(landId);
        List<PlotSummaryResponse> plotSummaries = plots.stream()
                .map(p -> PlotSummaryResponse.builder()
                        .plotId(p.getPlotId())
                        .landId(p.getLandId())
                        .plotCode(p.getPlotCode())
                        .area(p.getArea())
                        .pricePerPeriod(p.getPricePerPeriod())
                        .status(p.getStatus())
                        .isPublished(p.getIsPublished())
                        .imageUrl(p.getImageUrl())
                        .boundary(BoundaryCodec.toApi(p.getBoundaryGeojson()))
                        .build())
                .collect(Collectors.toList());

        long availableCount = plots.stream().filter(p -> p.getStatus() == PlotStatus.AVAIL).count();
        long rentedCount = plots.stream().filter(p -> p.getStatus() == PlotStatus.RENT).count();
        long maintCount = plots.stream().filter(p -> p.getStatus() == PlotStatus.MAINT).count();

        return LandDetailResponse.builder()
                .landId(land.getLandId())
                .landName(land.getLandName())
                .address(land.getAddress())
                .description(land.getDescription())
                .boundary(BoundaryCodec.toApi(land.getBoundaryGeojson()))
                .boundaryAreaM2(BoundaryCodec.areaOf(land.getBoundaryGeojson()))
                .totalPlots((long) plots.size())
                .availablePlots(availableCount)
                .rentedPlots(rentedCount)
                .maintenancePlots(maintCount)
                .createdAt(land.getCreatedAt())
                .updatedAt(land.getUpdatedAt())
                .plots(plotSummaries)
                .build();
    }

    @Override
    @Transactional
    public LandResponse createLand(LandRequest request) {
        log.info("Tạo nông trại mới: {}", request.getLandName());
        if (landRepository.existsByLandName(request.getLandName().trim())) {
            throw new ConflictException("Tên nông trại đã tồn tại: " + request.getLandName());
        }

        LandEntity land = LandEntity.builder()
                .landName(request.getLandName().trim())
                .address(request.getAddress().trim())
                .description(trimToNull(request.getDescription()))
                .boundaryGeojson(hasBoundary(request) ? BoundaryCodec.toGeoJson(boundaryRules.parse(request.getBoundary())) : null)
                .build();

        LandEntity saved = landRepository.save(land);
        return toLandResponse(saved);
    }

    @Override
    @Transactional
    public LandResponse updateLand(Integer landId, LandRequest request) {
        log.info("Cập nhật nông trại ID: {}", landId);
        LandEntity land = landRepository.findById(landId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nông trại với ID: " + landId));

        if (landRepository.existsByLandNameAndLandIdNot(request.getLandName().trim(), landId)) {
            throw new ConflictException("Tên nông trại đã được sử dụng bởi khu đất khác: " + request.getLandName());
        }

        land.setLandName(request.getLandName().trim());
        land.setAddress(request.getAddress().trim());
        if (request.getDescription() != null) {
            land.setDescription(trimToNull(request.getDescription()));
        }
        // null = giữ nguyên; [] = xoá ranh giới; có đỉnh = vẽ lại (phải còn chứa các thửa cũ)
        if (request.getBoundary() != null) {
            if (request.getBoundary().isEmpty()) {
                land.setBoundaryGeojson(null);
            } else {
                var ring = boundaryRules.parse(request.getBoundary());
                boundaryRules.checkLandStillContainsPlots(landId, ring);
                land.setBoundaryGeojson(BoundaryCodec.toGeoJson(ring));
            }
        }

        LandEntity updated = landRepository.save(land);
        return toLandResponse(updated);
    }

    @Override
    @Transactional
    public void deleteLand(Integer landId) {
        log.info("Xóa nông trại ID: {}", landId);
        LandEntity land = landRepository.findById(landId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nông trại với ID: " + landId));

        long rentedPlots = plotRepository.countByLandIdAndStatus(landId, PlotStatus.RENT);
        if (rentedPlots > 0) {
            throw new BadRequestException("Không thể xóa nông trại khi đang có " + rentedPlots + " thửa đất đang được thuê!");
        }

        long totalPlots = plotRepository.countByLandId(landId);
        if (totalPlots > 0) {
            throw new BadRequestException("Không thể xóa nông trại khi vẫn còn " + totalPlots + " thửa đất trực thuộc. Vui lòng xóa các thửa đất trước!");
        }

        landRepository.delete(land);
    }

    private LandResponse toLandResponse(LandEntity land) {
        long totalPlots = plotRepository.countByLandId(land.getLandId());
        long availablePlots = plotRepository.countByLandIdAndStatus(land.getLandId(), PlotStatus.AVAIL);
        long rentedPlots = plotRepository.countByLandIdAndStatus(land.getLandId(), PlotStatus.RENT);
        long maintenancePlots = plotRepository.countByLandIdAndStatus(land.getLandId(), PlotStatus.MAINT);

        return LandResponse.builder()
                .landId(land.getLandId())
                .landName(land.getLandName())
                .address(land.getAddress())
                .description(land.getDescription())
                .boundary(BoundaryCodec.toApi(land.getBoundaryGeojson()))
                .boundaryAreaM2(BoundaryCodec.areaOf(land.getBoundaryGeojson()))
                .totalPlots(totalPlots)
                .availablePlots(availablePlots)
                .rentedPlots(rentedPlots)
                .maintenancePlots(maintenancePlots)
                .createdAt(land.getCreatedAt())
                .updatedAt(land.getUpdatedAt())
                .build();
    }

    private static boolean hasBoundary(LandRequest request) {
        return request.getBoundary() != null && !request.getBoundary().isEmpty();
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
