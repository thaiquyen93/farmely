package com.smartagrirent.knowledge.service.impl;

import com.smartagrirent.knowledge.dto.request.CreateCropRequest;
import com.smartagrirent.knowledge.dto.response.CropResponse;
import com.smartagrirent.knowledge.entity.Crop;
import com.smartagrirent.knowledge.exception.ResourceNotFoundException;
import com.smartagrirent.knowledge.repository.CropRepository;
import com.smartagrirent.knowledge.service.CropService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CropServiceImpl implements CropService {

    private final CropRepository cropRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CropResponse> getAllCrops() {
        return cropRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CropResponse getCropById(Integer id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại cây với ID: " + id));
        return mapToResponse(crop);
    }

    @Override
    @Transactional
    public CropResponse createCrop(CreateCropRequest request) {
        if (cropRepository.findByCropNameIgnoreCase(request.getCropName()).isPresent()) {
            throw new IllegalArgumentException("Loại cây '" + request.getCropName() + "' đã tồn tại");
        }
        Crop crop = Crop.builder()
                .cropName(request.getCropName())
                .build();
        Crop saved = cropRepository.save(crop);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteCrop(Integer id) {
        if (!cropRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy loại cây với ID: " + id);
        }
        cropRepository.deleteById(id);
    }

    private CropResponse mapToResponse(Crop crop) {
        return CropResponse.builder()
                .cropId(crop.getCropId())
                .cropName(crop.getCropName())
                .createdAt(crop.getCreatedAt())
                .build();
    }
}
