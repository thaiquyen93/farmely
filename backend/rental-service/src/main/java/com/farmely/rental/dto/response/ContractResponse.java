package com.farmely.rental.dto.response;

import com.farmely.rental.entity.ContractStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractResponse {

    private Integer contractId;
    private String contractNumber;

    // Khách hàng
    private Integer renterId;
    private String renterName;
    private String renterEmail;
    private String renterPhone;

    // Chi phí & Trạng thái
    private BigDecimal totalAmount;
    private ContractStatus status;
    private String displayStatus;

    // Giữ chỗ (Reservation)
    private OffsetDateTime reservationExpiresAt;
    private Boolean isReservationExpired;

    private String contractDocumentUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Danh sách các thửa đất thuê trong hợp đồng
    private List<RentalResponse> rentals;
}
