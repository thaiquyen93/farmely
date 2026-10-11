package com.farmely.cultivation.dto.response;

import com.farmely.cultivation.entity.IssueStatus;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueReportResponse {

    private Integer issueId;
    private String issueCode; // e.g. ISS-901
    private Integer rentalId;
    private Integer reportedBy;
    private String reporterName;
    private Integer handledBy;
    private String expertName;
    private String issueType;
    private String description;
    private String imageUrl;
    private IssueStatus status;
    private String displayStatus;
    private String resolutionNotes;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime createdAt;

    // UI contextual details
    private String plotCode;
    private String plotName;
    private String cropName;
}
