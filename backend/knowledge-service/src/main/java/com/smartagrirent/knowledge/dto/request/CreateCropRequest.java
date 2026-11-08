package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCropRequest {

    @NotBlank(message = "Tên loại cây trồng không được để trống")
    @Size(min = 2, max = 150, message = "Tên loại cây từ 2 đến 150 ký tự")
    private String cropName;
}
