package com.farmely.rental.service.impl;

import com.farmely.rental.dto.request.BookSiteVisitRequest;
import com.farmely.rental.dto.response.SiteVisitResponse;
import com.farmely.rental.entity.PlotReference;
import com.farmely.rental.entity.SiteVisitEntity;
import com.farmely.rental.entity.VisitStatus;
import com.farmely.rental.exception.BadRequestException;
import com.farmely.rental.exception.ResourceNotFoundException;
import com.farmely.rental.mapper.RentalEntityMapper;
import com.farmely.rental.repository.PlotReferenceRepository;
import com.farmely.rental.repository.SiteVisitRepository;
import com.farmely.rental.service.SiteVisitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteVisitServiceImpl implements SiteVisitService {

    private final SiteVisitRepository siteVisitRepository;
    private final PlotReferenceRepository plotRepository;
    private final RentalEntityMapper mapper;

    @Override
    @Transactional
    public SiteVisitResponse bookSiteVisit(BookSiteVisitRequest request) {
        log.info("Đặt lịch thăm quan thửa đất ID: {} bởi {} vào {}", request.getPlotId(), request.getVisitorName(), request.getVisitDate());

        PlotReference plot = plotRepository.findById(request.getPlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + request.getPlotId()));

        if (request.getVisitDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Ngày thăm quan không được nằm trong quá khứ");
        }

        SiteVisitEntity visit = SiteVisitEntity.builder()
                .plotId(plot.getPlotId())
                .visitorName(request.getVisitorName())
                .visitorPhone(request.getVisitorPhone())
                .visitDate(request.getVisitDate())
                .visitSlot(request.getVisitSlot())
                .status(VisitStatus.PENDING)
                .build();

        SiteVisitEntity saved = siteVisitRepository.save(visit);
        log.info("Đặt lịch thăm quan thành công ID: {}", saved.getVisitId());
        return mapper.toSiteVisitResponse(saved);
    }

    @Override
    @Transactional
    public SiteVisitResponse confirmSiteVisit(Integer visitId) {
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thăm quan với ID: " + visitId));

        if (visit.getStatus() != VisitStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể xác nhận lịch thăm quan đang chờ duyệt");
        }

        visit.setStatus(VisitStatus.CONFIRMED);
        return mapper.toSiteVisitResponse(siteVisitRepository.save(visit));
    }

    @Override
    @Transactional
    public SiteVisitResponse completeSiteVisit(Integer visitId) {
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thăm quan với ID: " + visitId));

        if (visit.getStatus() != VisitStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể hoàn thành lịch thăm quan đã xác nhận");
        }

        visit.setStatus(VisitStatus.COMPLETED);
        return mapper.toSiteVisitResponse(siteVisitRepository.save(visit));
    }

    @Override
    @Transactional
    public SiteVisitResponse cancelSiteVisit(Integer visitId) {
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thăm quan với ID: " + visitId));

        if (visit.getStatus() == VisitStatus.COMPLETED) {
            throw new BadRequestException("Lịch thăm quan đã hoàn thành, không thể hủy");
        }

        visit.setStatus(VisitStatus.CANCELLED);
        return mapper.toSiteVisitResponse(siteVisitRepository.save(visit));
    }

    @Override
    @Transactional(readOnly = true)
    public SiteVisitResponse getSiteVisitById(Integer visitId) {
        SiteVisitEntity visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thăm quan với ID: " + visitId));
        return mapper.toSiteVisitResponse(visit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteVisitResponse> getAllSiteVisits(Integer plotId, LocalDate visitDate, VisitStatus status) {
        List<SiteVisitEntity> list;
        if (plotId != null && status != null) {
            list = siteVisitRepository.findByPlotIdAndStatus(plotId, status);
        } else if (plotId != null) {
            list = siteVisitRepository.findByPlotId(plotId);
        } else if (visitDate != null) {
            list = siteVisitRepository.findByVisitDate(visitDate);
        } else if (status != null) {
            list = siteVisitRepository.findByStatus(status);
        } else {
            list = siteVisitRepository.findAll();
        }

        return list.stream()
                .map(mapper::toSiteVisitResponse)
                .collect(Collectors.toList());
    }
}
