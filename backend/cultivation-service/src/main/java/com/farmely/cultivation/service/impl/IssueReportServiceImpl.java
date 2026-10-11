package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.CreateIssueReportRequest;
import com.farmely.cultivation.dto.request.DiagnoseIssueRequest;
import com.farmely.cultivation.dto.response.IssueReportResponse;
import com.farmely.cultivation.entity.IssueReportEntity;
import com.farmely.cultivation.entity.IssueStatus;
import com.farmely.cultivation.entity.RentalReference;
import com.farmely.cultivation.entity.UserReference;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.IssueReportRepository;
import com.farmely.cultivation.repository.RentalReferenceRepository;
import com.farmely.cultivation.repository.UserReferenceRepository;
import com.farmely.cultivation.service.IssueReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueReportServiceImpl implements IssueReportService {

    private final IssueReportRepository issueReportRepository;
    private final RentalReferenceRepository rentalReferenceRepository;
    private final UserReferenceRepository userReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<IssueReportResponse> getAllIssues(Integer rentalId, String status, Integer reportedBy, Integer handledBy) {
        List<IssueReportEntity> list;

        if (rentalId != null) {
            list = issueReportRepository.findByRentalIdOrderByCreatedAtDesc(rentalId);
        } else if (reportedBy != null) {
            list = issueReportRepository.findByReportedByOrderByCreatedAtDesc(reportedBy);
        } else if (handledBy != null) {
            list = issueReportRepository.findByHandledByOrderByCreatedAtDesc(handledBy);
        } else if (status != null && !status.isBlank()) {
            IssueStatus issueStatus = IssueStatus.fromString(status);
            list = issueReportRepository.findByStatusOrderByCreatedAtDesc(issueStatus);
        } else {
            list = issueReportRepository.findAll();
        }

        if (status != null && !status.isBlank() && rentalId != null) {
            IssueStatus issueStatus = IssueStatus.fromString(status);
            list = list.stream().filter(i -> i.getStatus() == issueStatus).toList();
        }

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IssueReportResponse getIssueById(Integer issueId) {
        IssueReportEntity entity = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự cố với mã: " + issueId));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public IssueReportResponse reportIssue(CreateIssueReportRequest request) {
        IssueReportEntity entity = IssueReportEntity.builder()
                .rentalId(request.getRentalId())
                .reportedBy(request.getReportedBy())
                .issueType(request.getIssueType())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .status(IssueStatus.OPEN)
                .build();

        IssueReportEntity saved = issueReportRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public IssueReportResponse diagnoseIssue(Integer issueId, DiagnoseIssueRequest request) {
        IssueReportEntity entity = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự cố với mã: " + issueId));

        entity.setHandledBy(request.getHandledBy());
        entity.setResolutionNotes(request.getResolutionNotes());

        if (Boolean.TRUE.equals(request.getMarkResolved())) {
            entity.setStatus(IssueStatus.RESOLVED);
            entity.setResolvedAt(OffsetDateTime.now());
        }

        IssueReportEntity saved = issueReportRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public IssueReportResponse resolveIssue(Integer issueId, String resolutionNotes) {
        IssueReportEntity entity = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự cố với mã: " + issueId));

        entity.setStatus(IssueStatus.RESOLVED);
        entity.setResolvedAt(OffsetDateTime.now());
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            entity.setResolutionNotes(resolutionNotes);
        }

        IssueReportEntity saved = issueReportRepository.save(entity);
        return mapToResponse(saved);
    }

    private IssueReportResponse mapToResponse(IssueReportEntity entity) {
        String issueCode = "ISS-" + entity.getIssueId();

        String reporterName = null;
        if (entity.getReportedBy() != null) {
            UserReference reporter = userReferenceRepository.findById(entity.getReportedBy()).orElse(null);
            if (reporter != null) {
                reporterName = reporter.getFullName();
            }
        }

        String expertName = null;
        if (entity.getHandledBy() != null) {
            UserReference expert = userReferenceRepository.findById(entity.getHandledBy()).orElse(null);
            if (expert != null) {
                expertName = expert.getFullName();
            }
        }

        String plotCode = null;
        String plotName = null;
        String cropName = null;

        if (entity.getRentalId() != null) {
            RentalReference rental = rentalReferenceRepository.findById(entity.getRentalId()).orElse(null);
            if (rental != null) {
                if (rental.getPlot() != null) {
                    plotCode = rental.getPlot().getPlotCode();
                    plotName = "Thửa " + rental.getPlot().getPlotCode();
                }
                if (rental.getVariety() != null) {
                    cropName = rental.getVariety().getVarietyName();
                }
            }
        }

        String displayStatus = (entity.getStatus() == IssueStatus.RESOLVED) ? "RESOLVED" : "PENDING";
        if (entity.getResolutionNotes() != null && !entity.getResolutionNotes().isBlank()) {
            displayStatus = "SOLVED_BY_EXPERT";
        }

        return IssueReportResponse.builder()
                .issueId(entity.getIssueId())
                .issueCode(issueCode)
                .rentalId(entity.getRentalId())
                .reportedBy(entity.getReportedBy())
                .reporterName(reporterName)
                .handledBy(entity.getHandledBy())
                .expertName(expertName)
                .issueType(entity.getIssueType())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .status(entity.getStatus())
                .displayStatus(displayStatus)
                .resolutionNotes(entity.getResolutionNotes())
                .resolvedAt(entity.getResolvedAt())
                .createdAt(entity.getCreatedAt())
                .plotCode(plotCode)
                .plotName(plotName)
                .cropName(cropName)
                .build();
    }
}
