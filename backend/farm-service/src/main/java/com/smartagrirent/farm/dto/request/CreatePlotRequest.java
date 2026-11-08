package com.smartagrirent.farm.dto.request;

import com.smartagrirent.farm.constant.PlotStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePlotRequest {

    @NotNull(message = "landId là bắt buộc")
    private Integer landId;

    @NotBlank(message = "Mã thửa đất (plotCode) là bắt buộc (vd: P-01, P-02)")
    private String plotCode;

    @NotNull(message = "Diện tích thửa đất là bắt buộc")
    @DecimalMin(value = "1.0", message = "Diện tích tối thiểu là 1 m²")
    private BigDecimal area;

    private String imageUrl;

    @NotNull(message = "Giá thuê mỗi kỳ là bắt buộc")
    @DecimalMin(value = "0.0", message = "Giá thuê không được âm")
    private BigDecimal pricePerPeriod;

    @Builder.Default
    private PlotStatus status = PlotStatus.AVAIL;

    @Builder.Default
    private Boolean isPublished = true;
}
