package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnoseIssueRequest {

    @NotNull(message = "Mã chuyên gia xử lý (handledBy) không được để trống")
    private Integer handledBy;

    @NotBlank(message = "Chỉ đạo kỹ thuật / Hướng giải quyết không được để trống")
    private String resolutionNotes;

    @Builder.Default
    private Boolean markResolved = false;
}
