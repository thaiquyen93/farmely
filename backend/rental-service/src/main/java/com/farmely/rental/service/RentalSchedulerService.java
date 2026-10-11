package com.farmely.rental.service;

import com.farmely.rental.entity.ContractEntity;
import com.farmely.rental.entity.ContractStatus;
import com.farmely.rental.entity.RentalEntity;
import com.farmely.rental.entity.RentalStatus;
import com.farmely.rental.repository.ContractRepository;
import com.farmely.rental.repository.RentalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalSchedulerService {

    private final ContractRepository contractRepository;
    private final RentalRepository rentalRepository;

    /**
     * BR08: Tự động hủy các lượt giữ chỗ quá hạn 15 phút (hoặc +10 phút ân hạn) mà chưa thanh toán
     * Chạy định kỳ mỗi 1 phút
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void expireStaleReservations() {
        OffsetDateTime now = OffsetDateTime.now();
        List<ContractEntity> expiredContracts = contractRepository.findByStatusAndReservationExpiresAtBefore(
                ContractStatus.PENDING_PAYMENT, now);

        if (!expiredContracts.isEmpty()) {
            log.info("Phát hiện {} hợp đồng giữ chỗ đã hết hạn thanh toán", expiredContracts.size());
            for (ContractEntity contract : expiredContracts) {
                contract.setStatus(ContractStatus.CANCELLED);
                List<RentalEntity> rentals = rentalRepository.findByContractId(contract.getContractId());
                for (RentalEntity rental : rentals) {
                    if (rental.getStatus() == RentalStatus.PENDING) {
                        rental.setStatus(RentalStatus.CANCELLED);
                    }
                }
                rentalRepository.saveAll(rentals);
                log.info("Đã tự động hủy hợp đồng quá hạn: {}", contract.getContractNumber());
            }
            contractRepository.saveAll(expiredContracts);
        }
    }

    /**
     * Tự động kích hoạt các lượt thuê đã xác nhận khi đến ngày bắt đầu canh tác (Start Date)
     * Chạy định kỳ mỗi 10 phút
     */
    @Scheduled(fixedDelay = 600000)
    @Transactional
    public void activateStartingRentals() {
        LocalDate today = LocalDate.now();
        List<RentalEntity> confirmedRentals = rentalRepository.findByStatus(RentalStatus.CONFIRMED);

        for (RentalEntity rental : confirmedRentals) {
            if (!rental.getStartDate().isAfter(today)) {
                rental.setStatus(RentalStatus.ACTIVE);
                rentalRepository.save(rental);
                log.info("Tự động kích hoạt lượt thuê ID {} cho thửa đất ID {} (Ngày bắt đầu: {})",
                        rental.getRentalId(), rental.getPlotId(), rental.getStartDate());
            }
        }
    }

    /**
     * BR22: Tự động hoàn thành các lượt thuê khi hết ngày kết thúc (End Date)
     * Khi tất cả các lượt thuê của hợp đồng đã kết thúc -> Hợp đồng chuyển sang COMPLETED
     * Chạy định kỳ mỗi 10 phút
     */
    @Scheduled(fixedDelay = 600000)
    @Transactional
    public void completeExpiredRentals() {
        LocalDate today = LocalDate.now();
        List<RentalEntity> activeRentals = rentalRepository.findByStatus(RentalStatus.ACTIVE);

        for (RentalEntity rental : activeRentals) {
            if (rental.getEndDate().isBefore(today)) {
                rental.setStatus(RentalStatus.DONE);
                rentalRepository.save(rental);
                log.info("Lượt thuê ID {} đã kết thúc chu kỳ canh tác", rental.getRentalId());

                // Kiểm tra hợp đồng xem toàn bộ lượt thuê đã kết thúc chưa
                List<RentalEntity> allRentals = rentalRepository.findByContractId(rental.getContractId());
                boolean allDone = allRentals.stream().allMatch(r ->
                        r.getStatus() == RentalStatus.DONE || r.getStatus() == RentalStatus.CANCELLED);

                if (allDone) {
                    contractRepository.findById(rental.getContractId()).ifPresent(contract -> {
                        if (contract.getStatus() == ContractStatus.ACTIVE) {
                            contract.setStatus(ContractStatus.COMPLETED);
                            contractRepository.save(contract);
                            log.info("Toàn bộ lượt thuê hoàn tất. Hợp đồng {} chuyển sang COMPLETED (Theo BR22)", contract.getContractNumber());
                        }
                    });
                }
            }
        }
    }
}
