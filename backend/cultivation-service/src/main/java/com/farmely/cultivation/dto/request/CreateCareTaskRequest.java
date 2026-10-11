package com.farmely.cultivation.dto.request;

import com.farmely.cultivation.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCareTaskRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    private Integer stepId;

    private Integer serviceRequestId;

    private Integer taskAssignedTo;

    private LocalDate dueDate;

    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    private String evidenceImageUrl;

    private String notes;
}
