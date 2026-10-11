package com.farmely.cultivation.dto.request;

import com.farmely.cultivation.entity.TaskStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCareTaskRequest {

    private Integer taskAssignedTo;

    private LocalDate dueDate;

    private TaskStatus status;

    private String evidenceImageUrl;

    private String notes;
}
