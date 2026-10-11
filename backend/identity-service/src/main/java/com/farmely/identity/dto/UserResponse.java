package com.farmely.identity.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Integer userId;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String address;
    private String role;
    private String status;
    private OffsetDateTime createdAt;
}
