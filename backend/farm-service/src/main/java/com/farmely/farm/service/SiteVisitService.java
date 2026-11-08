package com.farmely.farm.service;

import com.farmely.farm.constant.VisitStatus;
import com.farmely.farm.dto.SiteVisitCreateRequest;
import com.farmely.farm.dto.SiteVisitResponse;

import java.time.LocalDate;
import java.util.List;

public interface SiteVisitService {

    SiteVisitResponse createSiteVisit(SiteVisitCreateRequest request);

    List<SiteVisitResponse> getAllSiteVisits(Integer plotId, LocalDate visitDate, VisitStatus status, String phone);

    SiteVisitResponse getSiteVisitById(Integer visitId);

    SiteVisitResponse updateSiteVisitStatus(Integer visitId, VisitStatus status);

    void deleteSiteVisit(Integer visitId);
}
