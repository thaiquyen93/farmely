package com.farmely.farm.service.impl;

import com.farmely.farm.constant.VisitStatus;
import com.farmely.farm.dto.SiteVisitCreateRequest;
import com.farmely.farm.dto.SiteVisitResponse;
import com.farmely.farm.entity.LandEntity;
import com.farmely.farm.entity.PlotEntity;
import com.farmely.farm.entity.SiteVisitEntity;
import com.farmely.farm.exception.BadRequestException;
import com.farmely.farm.exception.ResourceNotFoundException;
import com.farmely.farm.repository.LandRepository;
import com.farmely.farm.repository.PlotRepository;
import com.farmely.farm.repository.SiteVisitRepository;
import com.farmely.farm.repository.SiteVisitSpecifications;
import com.farmely.farm.service.SiteVisitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteVisitServiceImpl implements SiteVisitService {

    private final SiteVisitRepository siteVisitRepository;
    private final PlotRepository plotRepository;
    private final LandRepository landRepository;

    @Override
    @Transactional
    public SiteVisitResponse createSiteVisit(SiteVisitCreateRequest request) {
        log.info("Khách hàng {} ({}) đặt lịch thăm quan thửa đất ID: {} vào ngày {}",
                request.getVisitorName(), request.getVisitorPhone(), request.getPlotId(), request.getVisitDate());

        PlotEntity plot = plotRepository.findById(request.getPlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + request.getPlotId()));

        LocalDate today = LocalDate.now();
        if (request.getVisitDate().isBefore(today.plusDays(1))) {
            throw new BadRequestException("Ngày thăm quan phải đặt trước ít nhất 24 giờ (từ ngày mai trở đi) theo quy định V3.2!");
        }

        if (request.getVisitDate().isAfter(today.plusDays(30))) {
            throw new BadRequestException("Ngày thăm quan không được vượt quá 30 ngày tới theo quy định V3.2!");
        }

        SiteVisitEntity visit = SiteVisitEntity.builder()
                .plotId(plot.getPlotId())
                .visitorName(request.getVisitorName().trim())
                .visitorPhone(request.getVisitorPhone().trim())
                .visitDate(request.getVisitDate())
                .visitSlot(request.getVisitSlot())
                .status(VisitStatus.PENDING)
                .build();

        SiteVisitEntity saved = siteVisitRepository.save(visit);
        return toSiteVisitResponse(saved, plot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteVisitResponse> getAllSiteVisits(Integer plotId, LocalDate visitDate, VisitStatus status, String phone) {
        List<SiteVisitEntity> visits = siteVisitRepository.findAll(SiteVisitSpecifications.withFilters(plotId, visitDate, status, phone));
        return visits.stream().map(this::toSiteVisitResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SiteVisitResponse getSiteVisitById(Integer visitId) {
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn thăm quan với ID: " + visitId));
        return toSiteVisitResponse(visit);
    }

    @Override
    @Transactional
    public SiteVisitResponse updateSiteVisitStatus(Integer visitId, VisitStatus status) {
        log.info("Cập nhật trạng thái lịch thăm quan ID: {} thành {}", visitId, status);
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn thăm quan với ID: " + visitId));

        visit.setStatus(status);
        SiteVisitEntity updated = siteVisitRepository.save(visit);
        return toSiteVisitResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSiteVisit(Integer visitId) {
        log.info("Xóa lịch thăm quan ID: {}", visitId);
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn thăm quan với ID: " + visitId));

        siteVisitRepository.delete(visit);
    }

    private SiteVisitResponse toSiteVisitResponse(SiteVisitEntity visit) {
        PlotEntity plot = visit.getPlot() != null ? visit.getPlot() : plotRepository.findById(visit.getPlotId()).orElse(null);
        return toSiteVisitResponse(visit, plot);
    }

    private SiteVisitResponse toSiteVisitResponse(SiteVisitEntity visit, PlotEntity plot) {
        LandEntity land = null;
        if (plot != null) {
            land = plot.getLand() != null ? plot.getLand() : landRepository.findById(plot.getLandId()).orElse(null);
        }

        return SiteVisitResponse.builder()
                .visitId(visit.getVisitId())
                .plotId(visit.getPlotId())
                .plotCode(plot != null ? plot.getPlotCode() : null)
                .landId(plot != null ? plot.getLandId() : null)
                .landName(land != null ? land.getLandName() : null)
                .visitorName(visit.getVisitorName())
                .visitorPhone(visit.getVisitorPhone())
                .visitDate(visit.getVisitDate())
                .visitSlot(visit.getVisitSlot())
                .status(visit.getStatus())
                .createdAt(visit.getCreatedAt())
                .build();
    }
}
