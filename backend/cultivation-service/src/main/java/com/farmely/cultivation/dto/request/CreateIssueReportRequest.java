package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIssueReportRequest {

    @NotNull(message = "Mã lượt thuê (rentalId) không được để trống")
    private Integer rentalId;

    @NotNull(message = "Mã người báo cáo (reportedBy) không được để trống")
    private Integer reportedBy;

    @NotBlank(message = "Loại sự cố không được để trống (ví dụ: SÂU HẠI, NẤM BỆNH, HỆ THỐNG TƯỚI)")
    private String issueType;

    @NotBlank(message = "Mô tả chi tiết sự cố không được để trống")
    private String description;

    private String imageUrl;
}
