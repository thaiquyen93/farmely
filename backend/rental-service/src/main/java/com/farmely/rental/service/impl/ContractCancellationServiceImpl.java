package com.farmely.rental.service.impl;

import com.farmely.rental.dto.request.CreateCancellationRequest;
import com.farmely.rental.dto.response.ContractCancellationResponse;
import com.farmely.rental.entity.*;
import com.farmely.rental.exception.BadRequestException;
import com.farmely.rental.exception.ResourceNotFoundException;
import com.farmely.rental.mapper.RentalEntityMapper;
import com.farmely.rental.repository.ContractCancellationRepository;
import com.farmely.rental.repository.ContractRepository;
import com.farmely.rental.repository.RentalRepository;
import com.farmely.rental.repository.UserReferenceRepository;
import com.farmely.rental.service.ContractCancellationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractCancellationServiceImpl implements ContractCancellationService {

    private final ContractCancellationRepository cancellationRepository;
    private final ContractRepository contractRepository;
    private final RentalRepository rentalRepository;
    private final UserReferenceRepository userRepository;
    private final RentalEntityMapper mapper;

    @Override
    @Transactional
    public ContractCancellationResponse requestCancellation(CreateCancellationRequest request) {
        log.info("Yêu cầu hủy hợp đồng ID: {} bởi người dùng ID: {}", request.getContractId(), request.getCancelledBy());

        ContractEntity contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + request.getContractId()));

        if (contract.getStatus() == ContractStatus.CANCELLED) {
            throw new BadRequestException("Hợp đồng này đã bị hủy trước đó");
        }
        if (contract.getStatus() == ContractStatus.COMPLETED) {
            throw new BadRequestException("Hợp đồng đã hoàn thành, không thể hủy");
        }

        userRepository.findById(request.getCancelledBy())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getCancelledBy()));

        // Kiểm tra xem đã có yêu cầu hủy nào đang PENDING chưa
        cancellationRepository.findByContractId(request.getContractId()).ifPresent(existing -> {
            if (existing.getStatus() == CancelStatus.PENDING) {
                throw new BadRequestException("Hợp đồng này đã có yêu cầu hủy đang chờ phê duyệt");
            }
        });

        ContractCancellationEntity cancellation = ContractCancellationEntity.builder()
                .contractId(contract.getContractId())
                .cancelledBy(request.getCancelledBy())
                .reason(request.getReason())
                .status(CancelStatus.PENDING)
                .build();

        ContractCancellationEntity saved = cancellationRepository.save(cancellation);
        List<RentalEntity> rentals = rentalRepository.findByContractId(contract.getContractId());

        log.info("Đã ghi nhận yêu cầu hủy ID: {} cho hợp đồng {}", saved.getCancellationId(), contract.getContractNumber());
        return mapper.toCancellationResponse(saved, contract, rentals);
    }

    @Override
    @Transactional
    public ContractCancellationResponse approveCancellation(Integer cancellationId) {
        log.info("Phê duyệt yêu cầu hủy ID: {}", cancellationId);

        ContractCancellationEntity cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hủy với ID: " + cancellationId));

        if (cancellation.getStatus() != CancelStatus.PENDING) {
            throw new BadRequestException("Yêu cầu hủy này đã được xử lý trước đó");
        }

        cancellation.setStatus(CancelStatus.APPROVED);
        cancellation.setProcessedAt(OffsetDateTime.now());
        ContractCancellationEntity saved = cancellationRepository.save(cancellation);

        // Hủy hợp đồng và tất cả các lượt thuê liên quan
        ContractEntity contract = contractRepository.findById(cancellation.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);

        List<RentalEntity> rentals = rentalRepository.findByContractId(contract.getContractId());
        for (RentalEntity rental : rentals) {
            rental.setStatus(RentalStatus.CANCELLED);
        }
        rentalRepository.saveAll(rentals);

        log.info("Phê duyệt hủy thành công hợp đồng: {}", contract.getContractNumber());
        return mapper.toCancellationResponse(saved, contract, rentals);
    }

    @Override
    @Transactional
    public ContractCancellationResponse rejectCancellation(Integer cancellationId) {
        log.info("Từ chối yêu cầu hủy ID: {}", cancellationId);

        ContractCancellationEntity cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hủy với ID: " + cancellationId));

        if (cancellation.getStatus() != CancelStatus.PENDING) {
            throw new BadRequestException("Yêu cầu hủy này đã được xử lý trước đó");
        }

        cancellation.setStatus(CancelStatus.DONE);
        cancellation.setProcessedAt(OffsetDateTime.now());
        ContractCancellationEntity saved = cancellationRepository.save(cancellation);

        ContractEntity contract = contractRepository.findById(cancellation.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
        List<RentalEntity> rentals = rentalRepository.findByContractId(contract.getContractId());

        return mapper.toCancellationResponse(saved, contract, rentals);
    }

    @Override
    @Transactional(readOnly = true)
    public ContractCancellationResponse getCancellationById(Integer cancellationId) {
        ContractCancellationEntity cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hủy với ID: " + cancellationId));

        ContractEntity contract = contractRepository.findById(cancellation.getContractId()).orElse(null);
        List<RentalEntity> rentals = contract != null ? rentalRepository.findByContractId(contract.getContractId()) : List.of();

        return mapper.toCancellationResponse(cancellation, contract, rentals);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractCancellationResponse> getAllCancellations(CancelStatus status) {
        List<ContractCancellationEntity> list = status != null
                ? cancellationRepository.findByStatus(status)
                : cancellationRepository.findAll();

        return list.stream().map(c -> {
            ContractEntity contract = contractRepository.findById(c.getContractId()).orElse(null);
            List<RentalEntity> rentals = contract != null ? rentalRepository.findByContractId(contract.getContractId()) : List.of();
            return mapper.toCancellationResponse(c, contract, rentals);
        }).collect(Collectors.toList());
    }
}
