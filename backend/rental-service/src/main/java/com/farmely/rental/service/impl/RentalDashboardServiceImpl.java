package com.farmely.rental.service.impl;

import com.farmely.rental.dto.response.RentalDashboardResponse;
import com.farmely.rental.entity.CancelStatus;
import com.farmely.rental.entity.ContractEntity;
import com.farmely.rental.entity.ContractStatus;
import com.farmely.rental.entity.RentalStatus;
import com.farmely.rental.entity.VisitStatus;
import com.farmely.rental.repository.ContractCancellationRepository;
import com.farmely.rental.repository.ContractRepository;
import com.farmely.rental.repository.RentalRepository;
import com.farmely.rental.repository.SiteVisitRepository;
import com.farmely.rental.service.RentalDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalDashboardServiceImpl implements RentalDashboardService {

    private final ContractRepository contractRepository;
    private final RentalRepository rentalRepository;
    private final ContractCancellationRepository cancellationRepository;
    private final SiteVisitRepository siteVisitRepository;

    @Override
    @Transactional(readOnly = true)
    public RentalDashboardResponse getDashboardStats() {
        long totalContracts = contractRepository.count();
        long activeContracts = contractRepository.countByStatus(ContractStatus.ACTIVE);
        long pendingPaymentContracts = contractRepository.countByStatus(ContractStatus.PENDING_PAYMENT);
        long completedContracts = contractRepository.countByStatus(ContractStatus.COMPLETED);
        long cancelledContracts = contractRepository.countByStatus(ContractStatus.CANCELLED);

        long totalRentals = rentalRepository.count();
        long activeRentals = rentalRepository.countByStatus(RentalStatus.ACTIVE);

        // Doanh thu từ các hợp đồng đã thanh toán / đang hoạt động hoặc hoàn thành
        List<ContractEntity> activeOrCompleted = contractRepository.findByStatus(ContractStatus.ACTIVE);
        activeOrCompleted.addAll(contractRepository.findByStatus(ContractStatus.COMPLETED));

        BigDecimal totalRevenue = activeOrCompleted.stream()
                .map(ContractEntity::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingCancellations = cancellationRepository.countByStatus(CancelStatus.PENDING);
        long pendingSiteVisits = siteVisitRepository.countByStatus(VisitStatus.PENDING);
        long confirmedSiteVisits = siteVisitRepository.countByStatus(VisitStatus.CONFIRMED);

        return RentalDashboardResponse.builder()
                .totalContracts(totalContracts)
                .activeContracts(activeContracts)
                .pendingPaymentContracts(pendingPaymentContracts)
                .completedContracts(completedContracts)
                .cancelledContracts(cancelledContracts)
                .totalRentals(totalRentals)
                .activeRentals(activeRentals)
                .totalContractRevenue(totalRevenue)
                .pendingCancellations(pendingCancellations)
                .pendingSiteVisits(pendingSiteVisits)
                .confirmedSiteVisits(confirmedSiteVisits)
                .build();
    }
}
