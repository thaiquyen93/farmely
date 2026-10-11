package com.farmely.rental.dto.request;

import com.farmely.rental.entity.VisitSlot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookSiteVisitRequest {

    @NotNull(message = "Mã thửa đất muốn thăm quan (plotId) không được để trống")
    private Integer plotId;

    @NotBlank(message = "Họ tên người đăng ký thăm quan không được để trống")
    private String visitorName;

    @NotBlank(message = "Số điện thoại liên hệ không được để trống")
    private String visitorPhone;

    @NotNull(message = "Ngày thăm quan (visitDate) không được để trống")
    private LocalDate visitDate;

    @NotNull(message = "Ca thăm quan (visitSlot: MORNING hoặc AFTERNOON) không được để trống")
    private VisitSlot visitSlot;
}
