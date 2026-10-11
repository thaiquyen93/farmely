package com.farmely.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandRequest {

    @NotBlank(message = "Tên nông trại không được để trống")
    @Size(max = 150, message = "Tên nông trại tối đa 150 ký tự")
    private String landName;

    @NotBlank(message = "Địa chỉ nông trại không được để trống")
    private String address;
}
