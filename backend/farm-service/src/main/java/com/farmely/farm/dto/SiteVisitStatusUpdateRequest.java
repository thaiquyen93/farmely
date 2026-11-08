package com.farmely.farm.dto;

import com.farmely.farm.constant.VisitStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisitStatusUpdateRequest {

    @NotNull(message = "Trạng thái lịch hẹn không được để trống")
    private VisitStatus status;
}
