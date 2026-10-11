package com.smartagrirent.farm.service.impl;

import com.smartagrirent.farm.constant.VisitStatus;
import com.smartagrirent.farm.dto.request.CreateSiteVisitRequest;
import com.smartagrirent.farm.dto.response.SiteVisitResponse;
import com.smartagrirent.farm.entity.SiteVisit;
import com.smartagrirent.farm.repository.SiteVisitRepository;
import com.smartagrirent.farm.service.SiteVisitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SiteVisitServiceImpl implements SiteVisitService {

    private final SiteVisitRepository siteVisitRepository;

    @Autowired
    public SiteVisitServiceImpl(SiteVisitRepository siteVisitRepository) {
        this.siteVisitRepository = siteVisitRepository;
    }

    @Override
    @Transactional
    public SiteVisitResponse createSiteVisit(CreateSiteVisitRequest request) {
        SiteVisit entity = new SiteVisit();
        entity.setPlotId(request.getPlotId());
        entity.setVisitorName(request.getVisitorName());
        entity.setVisitorPhone(request.getVisitorPhone());
        entity.setVisitorEmail(request.getVisitorEmail());
        entity.setVisitDate(request.getVisitDate());
        entity.setVisitSlot(request.getVisitSlot());
        entity.setGroupSize(request.getGroupSize() != null ? request.getGroupSize() : 1);
        entity.setNotes(request.getNotes());
        entity.setStatus(VisitStatus.PENDING);

        SiteVisit saved = siteVisitRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteVisitResponse> getAllSiteVisits() {
        return siteVisitRepository.findAllByOrderByVisitIdDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SiteVisitResponse getSiteVisitById(Integer id) {
        SiteVisit entity = siteVisitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn tham quan #" + id));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public SiteVisitResponse confirmSiteVisit(Integer id) {
        SiteVisit entity = siteVisitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn tham quan #" + id));
        entity.setStatus(VisitStatus.CONFIRMED);
        SiteVisit updated = siteVisitRepository.save(entity);
        return toResponse(updated);
    }

    private SiteVisitResponse toResponse(SiteVisit entity) {
        SiteVisitResponse res = new SiteVisitResponse();
        res.setVisitId(entity.getVisitId());
        res.setPlotId(entity.getPlotId());
        res.setPlotCode(entity.getPlotId() != null ? "L01-P0" + entity.getPlotId() : null);
        res.setVisitorName(entity.getVisitorName());
        res.setVisitorPhone(entity.getVisitorPhone());
        res.setVisitorEmail(entity.getVisitorEmail());
        res.setVisitDate(entity.getVisitDate());
        res.setVisitSlot(entity.getVisitSlot());
        res.setGroupSize(entity.getGroupSize());
        res.setNotes(entity.getNotes());
        res.setStatus(entity.getStatus());
        res.setCreatedAt(entity.getCreatedAt());
        return res;
    }
}
