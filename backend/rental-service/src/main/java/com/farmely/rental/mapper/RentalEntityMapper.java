package com.farmely.rental.mapper;

import com.farmely.rental.dto.response.ContractCancellationResponse;
import com.farmely.rental.dto.response.ContractResponse;
import com.farmely.rental.dto.response.RentalResponse;
import com.farmely.rental.dto.response.SiteVisitResponse;
import com.farmely.rental.entity.*;
import com.farmely.rental.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RentalEntityMapper {

    private final PlotReferenceRepository plotRepository;
    private final VarietyReferenceRepository varietyRepository;
    private final ServiceReferenceRepository serviceRepository;
    private final UserReferenceRepository userRepository;
    private final RentalRepository rentalRepository;

    public ContractResponse toContractResponse(ContractEntity contract) {
        if (contract == null) return null;

        UserReference renter = userRepository.findById(contract.getRenterId()).orElse(null);
        List<RentalEntity> rentals = rentalRepository.findByContractId(contract.getContractId());
        List<RentalResponse> rentalResponses = rentals.stream()
                .map(this::toRentalResponse)
                .collect(Collectors.toList());

        boolean isExpired = contract.getReservationExpiresAt() != null
                && OffsetDateTime.now().isAfter(contract.getReservationExpiresAt())
                && contract.getStatus() == ContractStatus.PENDING_PAYMENT;

        return ContractResponse.builder()
                .contractId(contract.getContractId())
                .contractNumber(contract.getContractNumber())
                .renterId(contract.getRenterId())
                .renterName(renter != null ? renter.getFullName() : null)
                .renterEmail(renter != null ? renter.getEmail() : null)
                .renterPhone(renter != null ? renter.getPhoneNumber() : null)
                .totalAmount(contract.getTotalAmount())
                .status(contract.getStatus())
                .displayStatus(mapContractStatusText(contract.getStatus()))
                .reservationExpiresAt(contract.getReservationExpiresAt())
                .isReservationExpired(isExpired)
                .contractDocumentUrl(contract.getContractDocumentUrl())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .rentals(rentalResponses)
                .build();
    }

    public RentalResponse toRentalResponse(RentalEntity rental) {
        if (rental == null) return null;

        PlotReference plot = plotRepository.findById(rental.getPlotId()).orElse(null);
        VarietyReference variety = varietyRepository.findById(rental.getVarietyId()).orElse(null);
        ServiceReference service = rental.getServiceId() != null
                ? serviceRepository.findById(rental.getServiceId()).orElse(null)
                : null;

        long durationDays = ChronoUnit.DAYS.between(rental.getStartDate(), rental.getEndDate());

        return RentalResponse.builder()
                .rentalId(rental.getRentalId())
                .contractId(rental.getContractId())
                .plotId(rental.getPlotId())
                .plotCode(plot != null ? plot.getPlotCode() : null)
                .plotArea(plot != null ? plot.getArea() : null)
                .plotImageUrl(plot != null ? plot.getImageUrl() : null)
                .varietyId(rental.getVarietyId())
                .varietyName(variety != null ? variety.getVarietyName() : null)
                .expectedDuration(variety != null ? variety.getExpectedDuration() : null)
                .serviceId(rental.getServiceId())
                .serviceName(service != null ? service.getServiceName() : null)
                .serviceType(service != null ? service.getServiceType() : null)
                .cultivationMode(rental.getServiceId() != null ? "ASSISTED_GROWING" : "SELF_GROWING")
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .durationDays(durationDays)
                .totalPrice(rental.getTotalPrice())
                .status(rental.getStatus())
                .displayStatus(mapRentalStatusText(rental.getStatus()))
                .parentRentalId(rental.getParentRentalId())
                .createdAt(rental.getCreatedAt())
                .updatedAt(rental.getUpdatedAt())
                .build();
    }

    public ContractCancellationResponse toCancellationResponse(ContractCancellationEntity cancellation,
                                                               ContractEntity contract,
                                                               List<RentalEntity> rentals) {
        if (cancellation == null) return null;

        UserReference canceller = userRepository.findById(cancellation.getCancelledBy()).orElse(null);

        // Tính toán hoàn tiền theo BR10
        LocalDate earliestStart = (rentals != null && !rentals.isEmpty())
                ? rentals.stream().map(RentalEntity::getStartDate).min(LocalDate::compareTo).orElse(LocalDate.now())
                : LocalDate.now();

        LocalDate requestDate = cancellation.getCreatedAt() != null
                ? cancellation.getCreatedAt().toLocalDate()
                : LocalDate.now();

        long daysBeforeStart = ChronoUnit.DAYS.between(requestDate, earliestStart);

        int refundPct;
        String note;
        if (daysBeforeStart >= 3) {
            refundPct = 80;
            note = "Hủy trước ngày bắt đầu >= 3 ngày: Hoàn 80%, khấu trừ 20% (Theo BR10)";
        } else if (daysBeforeStart > 0) {
            refundPct = 50;
            note = "Hủy trước ngày bắt đầu < 3 ngày: Hoàn 50%, khấu trừ 50% (Theo BR10)";
        } else {
            refundPct = 0;
            note = "Hủy từ ngày bắt đầu thuê trở đi: Không hoàn tiền (Theo BR10)";
        }

        BigDecimal totalPaid = contract != null ? contract.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal refundAmount = totalPaid
                .multiply(BigDecimal.valueOf(refundPct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        return ContractCancellationResponse.builder()
                .cancellationId(cancellation.getCancellationId())
                .contractId(cancellation.getContractId())
                .contractNumber(contract != null ? contract.getContractNumber() : null)
                .cancelledBy(cancellation.getCancelledBy())
                .cancellerName(canceller != null ? canceller.getFullName() : null)
                .reason(cancellation.getReason())
                .status(cancellation.getStatus())
                .refundPercentage(refundPct)
                .totalPaidAmount(totalPaid)
                .refundAmount(refundAmount)
                .refundPolicyNote(note)
                .createdAt(cancellation.getCreatedAt())
                .processedAt(cancellation.getProcessedAt())
                .build();
    }

    public SiteVisitResponse toSiteVisitResponse(SiteVisitEntity visit) {
        if (visit == null) return null;

        PlotReference plot = plotRepository.findById(visit.getPlotId()).orElse(null);

        String slotTime = visit.getVisitSlot() == VisitSlot.MORNING
                ? "08:00 - 11:00"
                : "14:00 - 17:00";

        return SiteVisitResponse.builder()
                .visitId(visit.getVisitId())
                .plotId(visit.getPlotId())
                .plotCode(plot != null ? plot.getPlotCode() : null)
                .plotName(plot != null ? "Thửa đất " + plot.getPlotCode() : null)
                .visitorName(visit.getVisitorName())
                .visitorPhone(visit.getVisitorPhone())
                .visitDate(visit.getVisitDate())
                .visitSlot(visit.getVisitSlot())
                .slotTime(slotTime)
                .status(visit.getStatus())
                .createdAt(visit.getCreatedAt())
                .build();
    }

    private String mapContractStatusText(ContractStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING_PAYMENT -> "Chờ thanh toán";
            case ACTIVE -> "Đang hiệu lực";
            case COMPLETED -> "Đã hoàn thành";
            case CANCELLED -> "Đã hủy";
        };
    }

    private String mapRentalStatusText(RentalStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "Chờ thanh toán";
            case CONFIRMED -> "Đã xác nhận";
            case ACTIVE -> "Đang canh tác";
            case DONE -> "Đã kết thúc";
            case CANCELLED -> "Đã hủy";
        };
    }
}
