package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.CreateDiaryRequest;
import com.farmely.cultivation.dto.request.UpdateDiaryRequest;
import com.farmely.cultivation.dto.response.FarmDiaryResponse;
import com.farmely.cultivation.entity.FarmDiaryEntity;
import com.farmely.cultivation.entity.RentalReference;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.CareTaskRepository;
import com.farmely.cultivation.repository.FarmDiaryRepository;
import com.farmely.cultivation.repository.RentalReferenceRepository;
import com.farmely.cultivation.service.FarmDiaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmDiaryServiceImpl implements FarmDiaryService {

    private final FarmDiaryRepository farmDiaryRepository;
    private final CareTaskRepository careTaskRepository;
    private final RentalReferenceRepository rentalReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FarmDiaryResponse> getAllDiaries(Integer rentalId) {
        List<FarmDiaryEntity> list;
        if (rentalId != null) {
            list = farmDiaryRepository.findByRentalIdOrderByCreatedAtDesc(rentalId);
        } else {
            list = farmDiaryRepository.findAll();
        }

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FarmDiaryResponse getDiaryById(Integer diaryId) {
        FarmDiaryEntity entity = farmDiaryRepository.findById(diaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký với mã: " + diaryId));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public FarmDiaryResponse createDiary(CreateDiaryRequest request) {
        FarmDiaryEntity entity = FarmDiaryEntity.builder()
                .rentalId(request.getRentalId())
                .taskId(request.getTaskId())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .build();

        FarmDiaryEntity saved = farmDiaryRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public FarmDiaryResponse updateDiary(Integer diaryId, UpdateDiaryRequest request) {
        FarmDiaryEntity entity = farmDiaryRepository.findById(diaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký với mã: " + diaryId));

        if (request.getContent() != null && !request.getContent().isBlank()) {
            entity.setContent(request.getContent());
        }
        if (request.getImageUrl() != null) {
            entity.setImageUrl(request.getImageUrl());
        }

        FarmDiaryEntity saved = farmDiaryRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteDiary(Integer diaryId) {
        FarmDiaryEntity entity = farmDiaryRepository.findById(diaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhật ký với mã: " + diaryId));
        farmDiaryRepository.delete(entity);
    }

    private FarmDiaryResponse mapToResponse(FarmDiaryEntity entity) {
        String plotCode = null;
        String plotName = null;
        String cropName = null;

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

        String taskTitle = null;
        if (entity.getTaskId() != null) {
            careTaskRepository.findById(entity.getTaskId()).ifPresent(task -> {
                // If there are notes, use them
            });
        }

        return FarmDiaryResponse.builder()
                .diaryId(entity.getDiaryId())
                .rentalId(entity.getRentalId())
                .taskId(entity.getTaskId())
                .content(entity.getContent())
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .plotCode(plotCode)
                .plotName(plotName)
                .cropName(cropName)
                .taskTitle(taskTitle)
                .build();
    }
}
