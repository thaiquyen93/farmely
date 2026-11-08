package com.smartagrirent.farm.service;

import com.smartagrirent.farm.dto.request.CreateSiteVisitRequest;
import com.smartagrirent.farm.dto.response.SiteVisitResponse;

import java.util.List;

public interface SiteVisitService {

    SiteVisitResponse createSiteVisit(CreateSiteVisitRequest request);

    List<SiteVisitResponse> getAllSiteVisits();

    SiteVisitResponse getSiteVisitById(Integer id);

    SiteVisitResponse confirmSiteVisit(Integer id);
}
