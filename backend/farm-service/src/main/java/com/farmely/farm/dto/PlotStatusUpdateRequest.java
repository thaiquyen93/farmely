package com.farmely.farm.dto;

import com.farmely.farm.constant.PlotStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotStatusUpdateRequest {

    @NotNull(message = "Trạng thái thửa đất không được để trống")
    private PlotStatus status;
}
