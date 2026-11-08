package com.farmely.rental.dto.response;

import com.farmely.rental.entity.CancelStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractCancellationResponse {

    private Integer cancellationId;
    private Integer contractId;
    private String contractNumber;

    private Integer cancelledBy;
    private String cancellerName;

    private String reason;
    private CancelStatus status;

    // Chính sách hoàn tiền theo BR10
    private Integer refundPercentage; // 80, 50, hoặc 0
    private BigDecimal totalPaidAmount;
    private BigDecimal refundAmount;
    private String refundPolicyNote;

    private OffsetDateTime createdAt;
    private OffsetDateTime processedAt;
}
