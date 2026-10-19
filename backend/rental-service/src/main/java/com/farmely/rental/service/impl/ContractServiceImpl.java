package com.farmely.rental.service.impl;

import com.farmely.rental.dto.request.CreateReservationRequest;
import com.farmely.rental.dto.request.PlotRentalItemRequest;
import com.farmely.rental.dto.response.ContractResponse;
import com.farmely.rental.entity.*;
import com.farmely.rental.exception.BadRequestException;
import com.farmely.rental.exception.ResourceNotFoundException;
import com.farmely.rental.mapper.RentalEntityMapper;
import com.farmely.rental.repository.*;
import com.farmely.rental.service.ContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final RentalRepository rentalRepository;
    private final PlotReferenceRepository plotRepository;
    private final VarietyReferenceRepository varietyRepository;
    private final ServiceReferenceRepository serviceRepository;
    private final UserReferenceRepository userRepository;
    private final PlotVarietyCompatibilityRepository compatibilityRepository;
    private final RentalEntityMapper mapper;

    @Override
    @Transactional
    public ContractResponse createReservation(CreateReservationRequest request) {
        log.info("Bắt đầu tạo đơn giữ chỗ cho khách hàng ID: {}", request.getRenterId());

        // 1. Kiểm tra khách hàng
        UserReference renter = userRepository.findById(request.getRenterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng với ID: " + request.getRenterId()));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Danh sách thửa đất thuê không được rỗng");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<RentalEntity> pendingRentals = new ArrayList<>();
        LocalDate earliestCultivationDate = LocalDate.now().plusDays(10);

        // 2. Kiểm tra từng thửa đất theo quy tắc nghiệp vụ BR03, BR04, BR05, BR07
        for (PlotRentalItemRequest item : request.getItems()) {
            if (item.getStartDate().isBefore(earliestCultivationDate)) {
                throw new BadRequestException("Ngày bắt đầu canh tác phải từ " + earliestCultivationDate
                        + " trở đi (tối thiểu 10 ngày sau ngày đặt thuê)");
            }

            PlotReference plot = plotRepository.findById(item.getPlotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + item.getPlotId()));

            if (plot.getStatus() != null && "MAINT".equalsIgnoreCase(plot.getStatus())) {
                throw new BadRequestException("Thửa đất " + plot.getPlotCode() + " hiện đang trong thời gian bảo dưỡng, không thể thuê");
            }

            VarietyReference variety = varietyRepository.findById(item.getVarietyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống rau với ID: " + item.getVarietyId()));

            // BR03: Kiểm tra tính tương thích giữa Thửa đất và Giống rau
            boolean isCompatible = compatibilityRepository.existsByPlotIdAndVarietyId(plot.getPlotId(), variety.getVarietyId());
            if (!isCompatible) {
                throw new BadRequestException("Giống rau '" + variety.getVarietyName() + "' không tương thích với thửa đất '" + plot.getPlotCode() + "' (Theo BR03)");
            }

            // Kiểm tra thứ tự ngày
            if (!item.getEndDate().isAfter(item.getStartDate())) {
                throw new BadRequestException("Ngày kết thúc phải lớn hơn ngày bắt đầu đối với thửa đất " + plot.getPlotCode());
            }

            // BR04: Thời gian thuê tối thiểu (expectedDuration + bufferTime)
            long rentDays = ChronoUnit.DAYS.between(item.getStartDate(), item.getEndDate());
            int minDays = variety.getExpectedDuration() + (variety.getBufferTime() != null ? variety.getBufferTime() : 0);
            if (rentDays < minDays) {
                throw new BadRequestException("Thời gian thuê thửa đất " + plot.getPlotCode() + " (" + rentDays + " ngày) không đạt tối thiểu "
                        + minDays + " ngày theo chu kỳ sinh trưởng của giống '" + variety.getVarietyName() + "' (Theo BR04)");
            }

            // BR07: Chống trùng lịch thuê (Availability Check)
            List<RentalEntity> overlaps = rentalRepository.findOverlappingRentals(plot.getPlotId(), item.getStartDate(), item.getEndDate());
            if (!overlaps.isEmpty()) {
                throw new BadRequestException("Thửa đất '" + plot.getPlotCode() + "' đã có lịch thuê trong khoảng thời gian "
                        + item.getStartDate() + " đến " + item.getEndDate() + " (Theo BR07)");
            }

            // Tính giá thửa đất
            BigDecimal plotPrice = plot.getPricePerPeriod() != null ? plot.getPricePerPeriod() : BigDecimal.ZERO;

            // Tính giá gói dịch vụ chăm sóc nếu chọn Assisted-growing (BR11)
            BigDecimal servicePrice = BigDecimal.ZERO;
            if (item.getServiceId() != null) {
                ServiceReference service = serviceRepository.findById(item.getServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ với ID: " + item.getServiceId()));
                servicePrice = service.getPrice() != null ? service.getPrice() : BigDecimal.ZERO;
            }

            BigDecimal itemTotalPrice = plotPrice.add(servicePrice);
            totalAmount = totalAmount.add(itemTotalPrice);

            RentalEntity rental = RentalEntity.builder()
                    .plotId(plot.getPlotId())
                    .varietyId(variety.getVarietyId())
                    .serviceId(item.getServiceId())
                    .startDate(item.getStartDate())
                    .endDate(item.getEndDate())
                    .totalPrice(itemTotalPrice)
                    .status(RentalStatus.PENDING)
                    .build();

            pendingRentals.add(rental);
        }

        // 3. Tạo mã hợp đồng duy nhất
        String contractNumber = "HD-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);

        // BR08: Khóa giữ chỗ 15 phút
        OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(15);

        ContractEntity contract = ContractEntity.builder()
                .renterId(renter.getUserId())
                .contractNumber(contractNumber)
                .totalAmount(totalAmount)
                .status(ContractStatus.PENDING_PAYMENT)
                .reservationExpiresAt(expiresAt)
                .build();

        ContractEntity savedContract = contractRepository.save(contract);

        // Gán contractId và lưu danh sách rentals
        for (RentalEntity rental : pendingRentals) {
            rental.setContractId(savedContract.getContractId());
        }
        rentalRepository.saveAll(pendingRentals);

        log.info("Tạo giữ chỗ thành công cho hợp đồng: {}, Hết hạn lúc: {}", contractNumber, expiresAt);
        return mapper.toContractResponse(savedContract);
    }

    @Override
    @Transactional
    public ContractResponse extendGracePeriod(Integer contractId) {
        log.info("Yêu cầu cộng thời gian ân hạn cho hợp đồng ID: {}", contractId);

        ContractEntity contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        if (contract.getStatus() != ContractStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Hợp đồng không ở trạng thái chờ thanh toán");
        }

        // BR08: Thời gian ân hạn 10 phút chỉ được cộng một lần cho mỗi lượt giữ chỗ
        if (contract.getReservationExpiresAt() != null && contract.getCreatedAt() != null) {
            long totalMinutesGranted = Duration.between(contract.getCreatedAt(), contract.getReservationExpiresAt()).toMinutes();
            if (totalMinutesGranted >= 20) {
                throw new BadRequestException("Thời gian ân hạn 10 phút đã được áp dụng trước đó cho hợp đồng này (Theo BR08)");
            }
        }

        OffsetDateTime currentExpiry = contract.getReservationExpiresAt() != null
                ? contract.getReservationExpiresAt()
                : OffsetDateTime.now();
        contract.setReservationExpiresAt(currentExpiry.plusMinutes(10));

        ContractEntity updated = contractRepository.save(contract);
        log.info("Cộng ân hạn thành công cho hợp đồng ID {}: Hết hạn mới: {}", contractId, updated.getReservationExpiresAt());
        return mapper.toContractResponse(updated);
    }

    @Override
    @Transactional
    public ContractResponse activateContract(Integer contractId) {
        log.info("Kích hoạt hợp đồng sau thanh toán thành công ID: {}", contractId);

        ContractEntity contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        if (contract.getStatus() == ContractStatus.CANCELLED) {
            throw new BadRequestException("Hợp đồng đã bị hủy, không thể kích hoạt");
        }

        contract.setStatus(ContractStatus.ACTIVE);

        // Kích hoạt các lượt thuê trong hợp đồng
        List<RentalEntity> rentals = rentalRepository.findByContractId(contractId);
        LocalDate today = LocalDate.now();

        for (RentalEntity rental : rentals) {
            if (rental.getStatus() != RentalStatus.CANCELLED) {
                if (!rental.getStartDate().isAfter(today)) {
                    rental.setStatus(RentalStatus.ACTIVE);
                } else {
                    rental.setStatus(RentalStatus.CONFIRMED);
                }

                // Cập nhật trạng thái thửa đất sang RENT trong bảng plots
                if (rental.getPlotId() != null) {
                    plotRepository.findById(rental.getPlotId()).ifPresent(p -> {
                        p.setStatus("RENT");
                        plotRepository.save(p);
                        log.info("Cập nhật trạng thái thửa đất ID {} sang RENT", p.getPlotId());
                    });
                }
            }
        }
        rentalRepository.saveAll(rentals);

        ContractEntity updated = contractRepository.save(contract);
        log.info("Hợp đồng {} đã được kích hoạt thành công", updated.getContractNumber());
        return mapper.toContractResponse(updated);
    }

    @Override
    @Transactional
    public ContractResponse cancelUnpaidContract(Integer contractId) {
        log.info("Hủy hợp đồng chưa thanh toán ID: {}", contractId);

        ContractEntity contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        if (contract.getStatus() != ContractStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Chỉ có thể hủy hợp đồng đang ở trạng thái chờ thanh toán");
        }

        contract.setStatus(ContractStatus.CANCELLED);

        List<RentalEntity> rentals = rentalRepository.findByContractId(contractId);
        for (RentalEntity rental : rentals) {
            rental.setStatus(RentalStatus.CANCELLED);
        }
        rentalRepository.saveAll(rentals);

        ContractEntity updated = contractRepository.save(contract);
        return mapper.toContractResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractById(Integer contractId) {
        ContractEntity contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));
        return mapper.toContractResponse(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractByNumber(String contractNumber) {
        ContractEntity contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với mã: " + contractNumber));
        return mapper.toContractResponse(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> getAllContracts(Integer renterId, ContractStatus status) {
        List<ContractEntity> list;
        if (renterId != null && status != null) {
            list = contractRepository.findByRenterIdAndStatus(renterId, status);
        } else if (renterId != null) {
            list = contractRepository.findByRenterId(renterId);
        } else if (status != null) {
            list = contractRepository.findByStatus(status);
        } else {
            list = contractRepository.findAll();
        }

        return list.stream()
                .map(mapper::toContractResponse)
                .collect(Collectors.toList());
    }
}
