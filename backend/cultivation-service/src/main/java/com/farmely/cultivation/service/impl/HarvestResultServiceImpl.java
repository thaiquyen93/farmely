package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.ConfirmHarvestRequest;
import com.farmely.cultivation.dto.request.RecordHarvestRequest;
import com.farmely.cultivation.dto.response.HarvestResultResponse;
import com.farmely.cultivation.entity.FarmDiaryEntity;
import com.farmely.cultivation.entity.HarvestResultEntity;
import com.farmely.cultivation.entity.CareTaskEntity;
import com.farmely.cultivation.entity.TaskStatus;
import com.farmely.cultivation.entity.RentalReference;
import com.farmely.cultivation.entity.UserReference;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.exception.BadRequestException;
import com.farmely.cultivation.repository.CareTaskRepository;
import com.farmely.cultivation.repository.TemplateStepReferenceRepository;
import com.farmely.cultivation.repository.FarmDiaryRepository;
import com.farmely.cultivation.repository.HarvestResultRepository;
import com.farmely.cultivation.repository.RentalReferenceRepository;
import com.farmely.cultivation.repository.UserReferenceRepository;
import com.farmely.cultivation.service.HarvestResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HarvestResultServiceImpl implements HarvestResultService {

    private final HarvestResultRepository harvestResultRepository;
    private final FarmDiaryRepository farmDiaryRepository;
    private final RentalReferenceRepository rentalReferenceRepository;
    private final UserReferenceRepository userReferenceRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CareTaskRepository careTaskRepository;
    private final TemplateStepReferenceRepository templateStepReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HarvestResultResponse> getAllHarvests(Integer rentalId, Boolean customerConfirmed, Integer enteredBy) {
        List<HarvestResultEntity> list;

        if (rentalId != null) {
            list = harvestResultRepository.findByRentalIdOrderByHarvestDateDesc(rentalId);
        } else if (enteredBy != null) {
            list = harvestResultRepository.findByEnteredByOrderByHarvestDateDesc(enteredBy);
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
        CareTaskEntity task = careTaskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy task thu hoạch"));
        if (!request.getRentalId().equals(task.getRentalId())) {
            throw new BadRequestException("Task thu hoạch không thuộc lượt thuê này");
        }
        boolean harvestStep = task.getStepId() != null && templateStepReferenceRepository.findById(task.getStepId())
                .map(step -> "HARVEST".equalsIgnoreCase(step.getTaskType()))
                .orElse(false);
        if (!harvestStep && (task.getStepId() != null || task.getNotes() == null
                || !task.getNotes().toLowerCase().contains("thu hoạch"))) {
            throw new BadRequestException("Task không phải đợt thu hoạch");
        }
        if (request.getEvidenceImageUrl() == null || request.getEvidenceImageUrl().isBlank()) {
            throw new BadRequestException("Cần ảnh thu hoạch thực tế");
        }
        var activeSeasons = jdbcTemplate.queryForList("""
                SELECT season_key FROM demo_cultivation_state
                WHERE rental_id = ? AND is_active ORDER BY updated_at DESC LIMIT 1
                """, request.getRentalId());
        String seasonKey = activeSeasons.isEmpty() ? "rental-" + request.getRentalId()
                : String.valueOf(activeSeasons.get(0).get("season_key"));
        if (request.getSeasonKey() != null && !request.getSeasonKey().equals(seasonKey)) {
            throw new BadRequestException("Vụ thu hoạch đã thay đổi, vui lòng tải lại task");
        }
        if (!seasonKey.matches("[a-zA-Z0-9:_-]{1,100}")) {
            throw new BadRequestException("Mã vụ không hợp lệ");
        }
        jdbcTemplate.query("SELECT pg_advisory_xact_lock(?, ?)",
                ps -> { ps.setInt(1, request.getRentalId()); ps.setInt(2, request.getTaskId()); },
                rs -> {});
        var existing = harvestResultRepository.findByRentalIdAndSeasonKeyAndHarvestTaskId(
                request.getRentalId(), seasonKey, request.getTaskId());
        if (existing.isPresent()) return mapToResponse(existing.get());

        HarvestResultEntity entity = HarvestResultEntity.builder()
                .rentalId(request.getRentalId())
                .seasonKey(seasonKey)
                .harvestTaskId(request.getTaskId())
                .enteredBy(request.getEnteredBy())
                .harvestDate(request.getHarvestDate() != null ? request.getHarvestDate() : LocalDate.now())
                .yieldAmount(request.getYieldAmount())
                .evidenceImageUrl(request.getEvidenceImageUrl())
                .deliveryType(request.getDeliveryType())
                .customerConfirmed(false)
                .build();

        HarvestResultEntity saved = harvestResultRepository.save(entity);

        task.setStatus(TaskStatus.DONE);
        task.setEvidenceImageUrl(saved.getEvidenceImageUrl());
        careTaskRepository.save(task);

        // Auto record into Farm Diary (BR20)
        String diaryContent = String.format("Hoàn tất thu hoạch vụ mùa. Sản lượng cân điện tử đạt: %.2f kg. Phương thức bàn giao: %s.",
                saved.getYieldAmount(), saved.getDeliveryType());
        FarmDiaryEntity diary = FarmDiaryEntity.builder()
                .rentalId(saved.getRentalId())
                .taskId(request.getTaskId())
                .harvestId(saved.getHarvestId())
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
        if (request.getRating() != null) {
            entity.setRating(request.getRating());
        }
        if (request.getFreshnessRating() != null) {
            entity.setFreshnessRating(request.getFreshnessRating());
        }
        if (request.getPackagingRating() != null) {
            entity.setPackagingRating(request.getPackagingRating());
        }
        if (request.getCustomerFeedback() != null && !request.getCustomerFeedback().isBlank()) {
            entity.setCustomerFeedback(request.getCustomerFeedback());
        }
        entity.setConfirmedAt(OffsetDateTime.now());

        HarvestResultEntity saved = harvestResultRepository.save(entity);
        if (Boolean.TRUE.equals(saved.getCustomerConfirmed()) && saved.getDeliveryType() != null) {
            jdbcTemplate.update("UPDATE rentals SET status = 'DONE', updated_at = NOW() WHERE rental_id = ? AND status = 'ACTIVE'", saved.getRentalId());
            jdbcTemplate.update("UPDATE plots SET status = 'MAINT', is_published = false, updated_at = NOW() WHERE plot_id = (SELECT plot_id FROM rentals WHERE rental_id = ?)", saved.getRentalId());
            jdbcTemplate.update("UPDATE contracts SET status = 'COMPLETED', updated_at = NOW() WHERE contract_id = (SELECT contract_id FROM rentals WHERE rental_id = ?) AND NOT EXISTS (SELECT 1 FROM rentals r WHERE r.contract_id = contracts.contract_id AND r.status NOT IN ('DONE', 'CANCELLED'))", saved.getRentalId());
        }

        log.info("Customer confirmed and rated harvest #{} with {} stars", saved.getHarvestId(), saved.getRating());
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
                .seasonKey(entity.getSeasonKey())
                .taskId(entity.getHarvestTaskId())
                .enteredBy(entity.getEnteredBy())
                .workerName(workerName)
                .harvestDate(entity.getHarvestDate())
                .yieldAmount(entity.getYieldAmount())
                .evidenceImageUrl(entity.getEvidenceImageUrl())
                .deliveryType(entity.getDeliveryType())
                .customerConfirmed(entity.getCustomerConfirmed())
                .rating(entity.getRating())
                .freshnessRating(entity.getFreshnessRating())
                .packagingRating(entity.getPackagingRating())
                .customerFeedback(entity.getCustomerFeedback())
                .confirmedAt(entity.getConfirmedAt())
                .createdAt(entity.getCreatedAt())
                .plotCode(plotCode)
                .plotName(plotName)
                .cropName(cropName)
                .customerName(customerName)
                .build();
    }
}
