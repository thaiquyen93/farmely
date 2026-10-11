package com.farmely.farm.dto;

import com.farmely.farm.constant.PlotStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotUpdateRequest {

    @NotNull(message = "Mã nông trại (landId) là bắt buộc")
    private Integer landId;

    @NotBlank(message = "Mã thửa đất (plotCode) là bắt buộc")
    @Size(max = 50, message = "Mã thửa đất tối đa 50 ký tự")
    private String plotCode;

    @NotNull(message = "Diện tích thửa đất là bắt buộc")
    @DecimalMin(value = "0.01", message = "Diện tích thửa đất phải lớn hơn 0 m²")
    private BigDecimal area;

    private String imageUrl;

    @NotNull(message = "Giá thuê theo kỳ là bắt buộc")
    @DecimalMin(value = "0.00", message = "Giá thuê không được âm")
    private BigDecimal pricePerPeriod;

    private PlotStatus status;

    private Boolean isPublished;

    private List<Integer> compatibleVarietyIds;
}
