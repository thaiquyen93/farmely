package com.farmely.rental.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalDashboardResponse {

    // Thống kê Hợp đồng
    private long totalContracts;
    private long activeContracts;
    private long pendingPaymentContracts;
    private long completedContracts;
    private long cancelledContracts;

    // Thống kê Lượt thuê đất
    private long totalRentals;
    private long activeRentals;

    // Doanh thu
    private BigDecimal totalContractRevenue;

    // Hủy & Thăm quan
    private long pendingCancellations;
    private long pendingSiteVisits;
    private long confirmedSiteVisits;
}
