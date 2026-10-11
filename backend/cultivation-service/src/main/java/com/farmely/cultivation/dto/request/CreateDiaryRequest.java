package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDiaryRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    private Integer taskId;

    @NotBlank(message = "Nội dung nhật ký không được để trống")
    private String content;

    private String imageUrl;
}
