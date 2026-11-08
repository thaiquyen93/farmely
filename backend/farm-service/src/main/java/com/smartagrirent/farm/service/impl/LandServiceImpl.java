package com.smartagrirent.farm.service.impl;

import com.smartagrirent.farm.dto.request.CreateLandRequest;
import com.smartagrirent.farm.dto.response.LandResponse;
import com.smartagrirent.farm.entity.Land;
import com.smartagrirent.farm.repository.LandRepository;
import com.smartagrirent.farm.repository.PlotRepository;
import com.smartagrirent.farm.service.LandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LandServiceImpl implements LandService {

    private final LandRepository landRepository;
    private final PlotRepository plotRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LandResponse> getAllLands() {
        return landRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LandResponse getLandById(Integer landId) {
        Land land = landRepository.findById(landId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khu đất với ID: " + landId));
        return mapToResponse(land);
    }

    @Override
    @Transactional
    public LandResponse createLand(CreateLandRequest request) {
        Land land = Land.builder()
                .landName(request.getLandName())
                .address(request.getAddress())
                .build();
        Land saved = landRepository.save(land);
        log.info("Đã tạo khu đất mới: {} (ID: {})", saved.getLandName(), saved.getLandId());
        return mapToResponse(saved);
    }

    private LandResponse mapToResponse(Land land) {
        int totalPlots = plotRepository.findByLandId(land.getLandId()).size();
        return LandResponse.builder()
                .landId(land.getLandId())
                .landName(land.getLandName())
                .address(land.getAddress())
                .totalPlots(totalPlots)
                .createdAt(land.getCreatedAt())
                .updatedAt(land.getUpdatedAt())
                .build();
    }
}
