package com.farmely.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phoneNumber;

    private String address;
}
