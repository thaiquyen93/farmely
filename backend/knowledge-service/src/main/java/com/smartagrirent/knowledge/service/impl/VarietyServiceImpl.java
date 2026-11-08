package com.smartagrirent.knowledge.service.impl;

import com.smartagrirent.knowledge.dto.request.CreateVarietyRequest;
import com.smartagrirent.knowledge.dto.response.VarietyResponse;
import com.smartagrirent.knowledge.entity.Crop;
import com.smartagrirent.knowledge.entity.Variety;
import com.smartagrirent.knowledge.exception.ResourceNotFoundException;
import com.smartagrirent.knowledge.repository.CropRepository;
import com.smartagrirent.knowledge.repository.VarietyRepository;
import com.smartagrirent.knowledge.service.VarietyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VarietyServiceImpl implements VarietyService {

    private final VarietyRepository varietyRepository;
    private final CropRepository cropRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VarietyResponse> getAllVarieties() {
        return varietyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VarietyResponse> getVarietiesByCropId(Integer cropId) {
        return varietyRepository.findByCropId(cropId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VarietyResponse getVarietyById(Integer id) {
        Variety variety = varietyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống cây với ID: " + id));
        return mapToResponse(variety);
    }

    @Override
    @Transactional
    public VarietyResponse createVariety(CreateVarietyRequest request) {
        Crop crop = cropRepository.findById(request.getCropId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại cây với ID: " + request.getCropId()));

        Variety variety = Variety.builder()
                .cropId(crop.getCropId())
                .varietyName(request.getVarietyName())
                .expectedDuration(request.getExpectedDuration())
                .bufferTime(request.getBufferTime() != null ? request.getBufferTime() : 0)
                .build();

        Variety saved = varietyRepository.save(variety);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVariety(Integer id) {
        if (!varietyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy giống cây với ID: " + id);
        }
        varietyRepository.deleteById(id);
    }

    private VarietyResponse mapToResponse(Variety v) {
        String cropName = "";
        if (v.getCrop() != null) {
            cropName = v.getCrop().getCropName();
        } else if (v.getCropId() != null) {
            cropName = cropRepository.findById(v.getCropId()).map(Crop::getCropName).orElse("");
        }

        return VarietyResponse.builder()
                .varietyId(v.getVarietyId())
                .cropId(v.getCropId())
                .cropName(cropName)
                .varietyName(v.getVarietyName())
                .expectedDuration(v.getExpectedDuration())
                .bufferTime(v.getBufferTime())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
