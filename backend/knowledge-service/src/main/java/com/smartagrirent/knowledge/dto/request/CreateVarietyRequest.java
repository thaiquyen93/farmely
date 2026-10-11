package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVarietyRequest {

    @NotNull(message = "Mã loại cây (cropId) là bắt buộc")
    private Integer cropId;

    @NotBlank(message = "Tên giống cây không được để trống")
    @Size(min = 2, max = 150, message = "Tên giống cây từ 2 đến 150 ký tự")
    private String varietyName;

    @NotNull(message = "Thời gian sinh trưởng dự kiến là bắt buộc")
    @Min(value = 1, message = "Thời gian sinh trưởng tối thiểu 1 ngày")
    private Integer expectedDuration;

    @Builder.Default
    @Min(value = 0, message = "Thời gian đệm tối thiểu 0 ngày")
    private Integer bufferTime = 0;
}
