package com.farmely.rental.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReservationRequest {

    @NotNull(message = "Mã khách hàng (renterId) không được để trống")
    private Integer renterId;

    @NotEmpty(message = "Danh sách thửa đất thuê (items) không được để trống")
    @Valid
    private List<PlotRentalItemRequest> items;
}
