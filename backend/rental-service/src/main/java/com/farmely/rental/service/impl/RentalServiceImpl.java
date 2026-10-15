package com.farmely.rental.service.impl;

import com.farmely.rental.dto.request.CheckAvailabilityRequest;
import com.farmely.rental.dto.request.RenewRentalRequest;
import com.farmely.rental.dto.response.AvailabilityCheckResponse;
import com.farmely.rental.dto.response.RentalResponse;
import com.farmely.rental.entity.*;
import com.farmely.rental.exception.BadRequestException;
import com.farmely.rental.exception.ResourceNotFoundException;
import com.farmely.rental.mapper.RentalEntityMapper;
import com.farmely.rental.repository.*;
import com.farmely.rental.service.RentalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final ContractRepository contractRepository;
    private final PlotReferenceRepository plotRepository;
    private final VarietyReferenceRepository varietyRepository;
    private final ServiceReferenceRepository serviceRepository;
    private final PlotVarietyCompatibilityRepository compatibilityRepository;
    private final RentalEntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public AvailabilityCheckResponse checkAvailability(CheckAvailabilityRequest request) {
        log.info("Kiểm tra khả dụng thửa đất ID: {}, Giống ID: {} từ {} đến {}",
                request.getPlotId(), request.getVarietyId(), request.getStartDate(), request.getEndDate());

        PlotReference plot = plotRepository.findById(request.getPlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + request.getPlotId()));

        VarietyReference variety = varietyRepository.findById(request.getVarietyId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống rau với ID: " + request.getVarietyId()));

        long requestedDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        int minRequiredDays = variety.getExpectedDuration() + (variety.getBufferTime() != null ? variety.getBufferTime() : 0);

        // BR03: Kiểm tra tính tương thích
        boolean compatible = compatibilityRepository.existsByPlotIdAndVarietyId(plot.getPlotId(), variety.getVarietyId());
        if (!compatible) {
            return AvailabilityCheckResponse.builder()
                    .available(false)
                    .plotId(plot.getPlotId())
                    .plotCode(plot.getPlotCode())
                    .pricePerPeriod(plot.getPricePerPeriod())
                    .varietyId(variety.getVarietyId())
                    .varietyName(variety.getVarietyName())
                    .compatible(false)
                    .minRequiredDays(minRequiredDays)
                    .requestedDays(requestedDays)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .message("Giống rau '" + variety.getVarietyName() + "' không tương thích với thửa đất '" + plot.getPlotCode() + "' (Theo BR03)")
                    .build();
        }

        // Kiểm tra bảo dưỡng đất
        if (plot.getStatus() != null && "MAINT".equalsIgnoreCase(plot.getStatus())) {
            return AvailabilityCheckResponse.builder()
                    .available(false)
                    .plotId(plot.getPlotId())
                    .plotCode(plot.getPlotCode())
                    .pricePerPeriod(plot.getPricePerPeriod())
                    .varietyId(variety.getVarietyId())
                    .varietyName(variety.getVarietyName())
                    .compatible(true)
                    .minRequiredDays(minRequiredDays)
                    .requestedDays(requestedDays)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .message("Thửa đất '" + plot.getPlotCode() + "' hiện đang bảo dưỡng (Theo BR23)")
                    .build();
        }

        // BR04: Kiểm tra thời gian tối thiểu
        if (requestedDays < minRequiredDays) {
            return AvailabilityCheckResponse.builder()
                    .available(false)
                    .plotId(plot.getPlotId())
                    .plotCode(plot.getPlotCode())
                    .pricePerPeriod(plot.getPricePerPeriod())
                    .varietyId(variety.getVarietyId())
                    .varietyName(variety.getVarietyName())
                    .compatible(true)
                    .minRequiredDays(minRequiredDays)
                    .requestedDays(requestedDays)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .message("Thời gian thuê (" + requestedDays + " ngày) không đủ tối thiểu " + minRequiredDays + " ngày theo chu kỳ sinh trưởng của giống (Theo BR04)")
                    .build();
        }

        // BR07: Kiểm tra trùng lịch
        List<RentalEntity> overlaps = rentalRepository.findOverlappingRentals(plot.getPlotId(), request.getStartDate(), request.getEndDate());
        if (!overlaps.isEmpty()) {
            return AvailabilityCheckResponse.builder()
                    .available(false)
                    .plotId(plot.getPlotId())
                    .plotCode(plot.getPlotCode())
                    .pricePerPeriod(plot.getPricePerPeriod())
                    .varietyId(variety.getVarietyId())
                    .varietyName(variety.getVarietyName())
                    .compatible(true)
                    .minRequiredDays(minRequiredDays)
                    .requestedDays(requestedDays)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .message("Thửa đất '" + plot.getPlotCode() + "' đã có lịch thuê trùng lặp trong khoảng thời gian đã chọn (Theo BR07)")
                    .build();
        }

        return AvailabilityCheckResponse.builder()
                .available(true)
                .plotId(plot.getPlotId())
                .plotCode(plot.getPlotCode())
                .pricePerPeriod(plot.getPricePerPeriod())
                .varietyId(variety.getVarietyId())
                .varietyName(variety.getVarietyName())
                .compatible(true)
                .minRequiredDays(minRequiredDays)
                .requestedDays(requestedDays)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .message("Thửa đất khả dụng cho thuê từ " + request.getStartDate() + " đến " + request.getEndDate())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalResponse getRentalById(Integer rentalId) {
        RentalEntity rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt thuê với ID: " + rentalId));
        return mapper.toRentalResponse(rental);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalResponse> getAllRentals(Integer renterId, Integer plotId, Integer contractId, RentalStatus status) {
        List<RentalEntity> list;
        if (renterId != null) {
            list = rentalRepository.findByRenterId(renterId);
        } else if (contractId != null) {
            list = rentalRepository.findByContractId(contractId);
        } else if (plotId != null && status != null) {
            list = rentalRepository.findByPlotIdAndStatus(plotId, status);
        } else if (plotId != null) {
            list = rentalRepository.findByPlotId(plotId);
        } else if (status != null) {
            list = rentalRepository.findByStatus(status);
        } else {
            list = rentalRepository.findAll();
        }

        return list.stream()
                .map(mapper::toRentalResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RentalResponse renewRental(Integer rentalId, RenewRentalRequest request) {
        log.info("Yêu cầu gia hạn lượt thuê ID: {} đến ngày {}", rentalId, request.getNewEndDate());

        RentalEntity existing = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt thuê với ID: " + rentalId));

        if (existing.getStatus() != RentalStatus.ACTIVE && existing.getStatus() != RentalStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể gia hạn lượt thuê đang hoạt động hoặc đã xác nhận");
        }

        // BR12: Việc gia hạn phải được thực hiện trước ngày kết thúc hợp đồng ít nhất 3 ngày
        long daysUntilEnd = ChronoUnit.DAYS.between(LocalDate.now(), existing.getEndDate());
        if (daysUntilEnd < 3) {
            throw new BadRequestException("Yêu cầu gia hạn phải được thực hiện trước ngày kết thúc hợp đồng ít nhất 3 ngày (Theo BR12). Ngày kết thúc hiện tại: " + existing.getEndDate());
        }

        LocalDate newStartDate = existing.getEndDate().plusDays(1);
        if (!request.getNewEndDate().isAfter(newStartDate)) {
            throw new BadRequestException("Ngày kết thúc gia hạn phải lớn hơn ngày bắt đầu gia hạn (" + newStartDate + ")");
        }

        Integer newVarietyId = request.getNewVarietyId() != null ? request.getNewVarietyId() : existing.getVarietyId();
        Integer newServiceId = request.getNewServiceId() != null ? request.getNewServiceId() : existing.getServiceId();

        PlotReference plot = plotRepository.findById(existing.getPlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thửa đất với ID: " + existing.getPlotId()));
        VarietyReference variety = varietyRepository.findById(newVarietyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống rau với ID: " + newVarietyId));

        // BR03: Kiểm tra tính tương thích
        boolean compatible = compatibilityRepository.existsByPlotIdAndVarietyId(plot.getPlotId(), variety.getVarietyId());
        if (!compatible) {
            throw new BadRequestException("Giống rau '" + variety.getVarietyName() + "' không tương thích với thửa đất '" + plot.getPlotCode() + "' (Theo BR03)");
        }

        // BR04: Kiểm tra thời gian tối thiểu
        long newDuration = ChronoUnit.DAYS.between(newStartDate, request.getNewEndDate());
        int minDays = variety.getExpectedDuration() + (variety.getBufferTime() != null ? variety.getBufferTime() : 0);
        if (newDuration < minDays) {
            throw new BadRequestException("Thời gian gia hạn (" + newDuration + " ngày) không đạt tối thiểu " + minDays + " ngày theo chu kỳ sinh trưởng của giống '" + variety.getVarietyName() + "' (Theo BR04)");
        }

        // BR07 / BR12: Kiểm tra thửa đất còn khả dụng trong khoảng thời gian tiếp theo
        List<RentalEntity> overlaps = rentalRepository.findOverlappingRentals(plot.getPlotId(), newStartDate, request.getNewEndDate());
        if (!overlaps.isEmpty()) {
            throw new BadRequestException("Thửa đất '" + plot.getPlotCode() + "' đã có lịch thuê trong thời gian gia hạn từ " + newStartDate + " đến " + request.getNewEndDate() + " (Theo BR07)");
        }

        // Tính phí gia hạn
        BigDecimal plotPrice = plot.getPricePerPeriod() != null ? plot.getPricePerPeriod() : BigDecimal.ZERO;
        BigDecimal servicePrice = BigDecimal.ZERO;
        if (newServiceId != null) {
            ServiceReference service = serviceRepository.findById(newServiceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ với ID: " + newServiceId));
            servicePrice = service.getPrice() != null ? service.getPrice() : BigDecimal.ZERO;
        }
        BigDecimal renewalPrice = plotPrice.add(servicePrice);

        // Tạo bản ghi lượt thuê gia hạn mới kế thừa lịch sử qua parentRentalId (BR12)
        RentalEntity renewalRental = RentalEntity.builder()
                .contractId(existing.getContractId())
                .plotId(existing.getPlotId())
                .varietyId(newVarietyId)
                .serviceId(newServiceId)
                .parentRentalId(existing.getRentalId())
                .startDate(newStartDate)
                .endDate(request.getNewEndDate())
                .totalPrice(renewalPrice)
                .status(RentalStatus.CONFIRMED)
                .build();

        RentalEntity savedRenewal = rentalRepository.save(renewalRental);

        // Cập nhật tổng tiền hợp đồng
        ContractEntity contract = contractRepository.findById(existing.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
        contract.setTotalAmount(contract.getTotalAmount().add(renewalPrice));
        contractRepository.save(contract);

        log.info("Gia hạn thành công lượt thuê ID {} -> Lượt thuê mới ID {}", existing.getRentalId(), savedRenewal.getRentalId());
        return mapper.toRentalResponse(savedRenewal);
    }
}
