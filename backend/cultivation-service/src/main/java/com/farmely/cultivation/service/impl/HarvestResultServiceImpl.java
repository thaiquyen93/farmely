package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.ConfirmHarvestRequest;
import com.farmely.cultivation.dto.request.RecordHarvestRequest;
import com.farmely.cultivation.dto.response.HarvestResultResponse;
import com.farmely.cultivation.entity.FarmDiaryEntity;
import com.farmely.cultivation.entity.HarvestResultEntity;
import com.farmely.cultivation.entity.RentalReference;
import com.farmely.cultivation.entity.UserReference;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.FarmDiaryRepository;
import com.farmely.cultivation.repository.HarvestResultRepository;
import com.farmely.cultivation.repository.RentalReferenceRepository;
import com.farmely.cultivation.repository.UserReferenceRepository;
import com.farmely.cultivation.service.HarvestResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HarvestResultServiceImpl implements HarvestResultService {

    private final HarvestResultRepository harvestResultRepository;
    private final FarmDiaryRepository farmDiaryRepository;
    private final RentalReferenceRepository rentalReferenceRepository;
    private final UserReferenceRepository userReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HarvestResultResponse> getAllHarvests(Integer rentalId, Boolean customerConfirmed) {
        List<HarvestResultEntity> list;

        if (rentalId != null) {
            list = harvestResultRepository.findByRentalIdOrderByHarvestDateDesc(rentalId);
        } else if (customerConfirmed != null) {
            list = harvestResultRepository.findByCustomerConfirmedOrderByHarvestDateDesc(customerConfirmed);
        } else {
            list = harvestResultRepository.findAll();
        }

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HarvestResultResponse getHarvestById(Integer harvestId) {
        HarvestResultEntity entity = harvestResultRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả thu hoạch với mã: " + harvestId));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public HarvestResultResponse recordHarvest(RecordHarvestRequest request) {
        HarvestResultEntity entity = HarvestResultEntity.builder()
                .rentalId(request.getRentalId())
                .enteredBy(request.getEnteredBy())
                .harvestDate(request.getHarvestDate() != null ? request.getHarvestDate() : LocalDate.now())
                .yieldAmount(request.getYieldAmount())
                .evidenceImageUrl(request.getEvidenceImageUrl())
                .deliveryType(request.getDeliveryType())
                .customerConfirmed(false)
                .build();

        HarvestResultEntity saved = harvestResultRepository.save(entity);

        // Auto record into Farm Diary (BR20)
        String diaryContent = String.format("Hoàn tất thu hoạch vụ mùa. Sản lượng cân điện tử đạt: %.2f kg. Phương thức bàn giao: %s.",
                saved.getYieldAmount(), saved.getDeliveryType());
        FarmDiaryEntity diary = FarmDiaryEntity.builder()
                .rentalId(saved.getRentalId())
                .content(diaryContent)
                .imageUrl(saved.getEvidenceImageUrl())
                .build();
        farmDiaryRepository.save(diary);

        log.info("Recorded harvest #{} for rental #{} with yield: {} kg", saved.getHarvestId(), saved.getRentalId(), saved.getYieldAmount());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public HarvestResultResponse confirmHarvest(Integer harvestId, ConfirmHarvestRequest request) {
        HarvestResultEntity entity = harvestResultRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả thu hoạch với mã: " + harvestId));

        entity.setCustomerConfirmed(request.getConfirmed() != null ? request.getConfirmed() : true);
        if (request.getDeliveryType() != null) {
            entity.setDeliveryType(request.getDeliveryType());
        }
        HarvestResultEntity saved = harvestResultRepository.save(entity);

        log.info("Customer confirmed harvest #{}", saved.getHarvestId());
        return mapToResponse(saved);
    }

    private HarvestResultResponse mapToResponse(HarvestResultEntity entity) {
        String harvestCode = "HV-" + entity.getHarvestId();

        String workerName = null;
        if (entity.getEnteredBy() != null) {
            UserReference worker = userReferenceRepository.findById(entity.getEnteredBy()).orElse(null);
            if (worker != null) {
                workerName = worker.getFullName();
            }
        }

        String plotCode = null;
        String plotName = null;
        String cropName = null;
        String customerName = null;

        if (entity.getRentalId() != null) {
            RentalReference rental = rentalReferenceRepository.findById(entity.getRentalId()).orElse(null);
            if (rental != null) {
                if (rental.getPlot() != null) {
                    plotCode = rental.getPlot().getPlotCode();
                    plotName = "Thửa " + rental.getPlot().getPlotCode();
                }
                if (rental.getVariety() != null) {
                    cropName = rental.getVariety().getVarietyName();
                }
            }
        }

        return HarvestResultResponse.builder()
                .harvestId(entity.getHarvestId())
                .harvestCode(harvestCode)
                .rentalId(entity.getRentalId())
                .enteredBy(entity.getEnteredBy())
                .workerName(workerName)
                .harvestDate(entity.getHarvestDate())
                .yieldAmount(entity.getYieldAmount())
                .evidenceImageUrl(entity.getEvidenceImageUrl())
                .deliveryType(entity.getDeliveryType())
                .customerConfirmed(entity.getCustomerConfirmed())
                .createdAt(entity.getCreatedAt())
                .plotCode(plotCode)
                .plotName(plotName)
                .cropName(cropName)
                .customerName(customerName)
                .build();
    }
}
