package com.smartagrirent.farm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateLandRequest {

    @NotBlank(message = "Tên khu đất / nông trại không được để trống")
    private String landName;

    @NotBlank(message = "Địa chỉ khu đất không được để trống")
    private String address;
}
