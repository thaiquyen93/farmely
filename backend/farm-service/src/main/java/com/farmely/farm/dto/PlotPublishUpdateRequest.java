package com.farmely.farm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotPublishUpdateRequest {

    @NotNull(message = "Cờ hiển thị (isPublished) không được để trống")
    private Boolean isPublished;
}
