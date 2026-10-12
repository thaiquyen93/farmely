package com.farmely.rental.service;

import com.farmely.rental.dto.request.BookSiteVisitRequest;
import com.farmely.rental.dto.response.SiteVisitResponse;
import com.farmely.rental.entity.VisitStatus;

import java.time.LocalDate;
import java.util.List;

public interface SiteVisitService {

    SiteVisitResponse bookSiteVisit(BookSiteVisitRequest request);

    SiteVisitResponse confirmSiteVisit(Integer visitId);

    SiteVisitResponse completeSiteVisit(Integer visitId);

    SiteVisitResponse cancelSiteVisit(Integer visitId);

    SiteVisitResponse getSiteVisitById(Integer visitId);

    List<SiteVisitResponse> getAllSiteVisits(Integer plotId, LocalDate visitDate, VisitStatus status);
}
