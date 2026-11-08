package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.CreateIssueReportRequest;
import com.farmely.cultivation.dto.request.DiagnoseIssueRequest;
import com.farmely.cultivation.dto.response.IssueReportResponse;

import java.util.List;

public interface IssueReportService {

    List<IssueReportResponse> getAllIssues(Integer rentalId, String status, Integer reportedBy, Integer handledBy);

    IssueReportResponse getIssueById(Integer issueId);

    IssueReportResponse reportIssue(CreateIssueReportRequest request);

    IssueReportResponse diagnoseIssue(Integer issueId, DiagnoseIssueRequest request);

    IssueReportResponse resolveIssue(Integer issueId, String resolutionNotes);
}
