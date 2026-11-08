package com.smartagrirent.farm.dto.request;

import com.smartagrirent.farm.constant.PlotStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlotStatusRequest {

    @NotNull(message = "Trạng thái thửa đất là bắt buộc (AVAIL, RENT, MAINT)")
    private PlotStatus status;
}
