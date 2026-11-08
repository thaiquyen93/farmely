package com.farmely.cultivation.dto.response;

import com.farmely.cultivation.entity.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareTaskResponse {

    private Integer taskId;
    private String taskCode; // e.g. TSK-101
    private Integer rentalId;
    private Integer stepId;
    private Integer serviceRequestId;
    private Integer taskAssignedTo;
    private String workerName;
    private LocalDate dueDate;
    private String session; // MORNING | AFTERNOON
    private TaskStatus status; // PENDING | IN_PROG | DONE
    private String displayStatus; // PENDING | IN_PROGRESS | COMPLETED | OVERDUE
    private Boolean isOverdue;
    private String evidenceImageUrl;
    private String notes;
    private String title;
    private String instructions;

    // UI contextual details
    private String plotCode;
    private String plotName;
    private String cropName;
    private String customerName;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
