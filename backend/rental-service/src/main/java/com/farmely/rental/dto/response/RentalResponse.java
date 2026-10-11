package com.farmely.rental.dto.response;

import com.farmely.rental.entity.RentalStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalResponse {

    private Integer rentalId;
    private Integer contractId;

    // Thông tin thửa đất
    private Integer plotId;
    private String plotCode;
    private BigDecimal plotArea;
    private String plotImageUrl;

    // Thông tin giống rau
    private Integer varietyId;
    private String varietyName;
    private Integer expectedDuration;

    // Thông tin dịch vụ
    private Integer serviceId;
    private String serviceName;
    private String serviceType;
    private String cultivationMode; // SELF_GROWING hoặc ASSISTED_GROWING

    // Thời gian & Giá
    private LocalDate startDate;
    private LocalDate endDate;
    private Long durationDays;
    private BigDecimal totalPrice;

    // Trạng thái
    private RentalStatus status;
    private String displayStatus;

    // Gia hạn
    private Integer parentRentalId;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
