package com.farmely.rental.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCancellationRequest {

    @NotNull(message = "Mã hợp đồng (contractId) không được để trống")
    private Integer contractId;

    @NotNull(message = "Người yêu cầu hủy (cancelledBy) không được để trống")
    private Integer cancelledBy;

    @NotBlank(message = "Lý do hủy hợp đồng không được để trống")
    private String reason;
}
