package com.smartagrirent.knowledge.service;

import com.smartagrirent.knowledge.dto.request.CreateCropRequest;
import com.smartagrirent.knowledge.dto.response.CropResponse;

import java.util.List;

public interface CropService {
    List<CropResponse> getAllCrops();
    CropResponse getCropById(Integer id);
    CropResponse createCrop(CreateCropRequest request);
    void deleteCrop(Integer id);
}
