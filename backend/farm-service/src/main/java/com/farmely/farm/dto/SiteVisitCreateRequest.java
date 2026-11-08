package com.farmely.farm.dto;

import com.farmely.farm.constant.VisitSlot;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisitCreateRequest {

    @NotNull(message = "Mã thửa đất (plotId) là bắt buộc")
    private Integer plotId;

    @NotBlank(message = "Họ và tên người thăm quan là bắt buộc")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    private String visitorName;

    @NotBlank(message = "Số điện thoại liên hệ là bắt buộc")
    @Pattern(regexp = "^0[0-9]{9}$", message = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0")
    private String visitorPhone;

    @NotNull(message = "Ngày dự kiến thăm quan là bắt buộc")
    private LocalDate visitDate;

    @NotNull(message = "Khung giờ thăm quan (MORNING hoặc AFTERNOON) là bắt buộc")
    private VisitSlot visitSlot;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;
}
