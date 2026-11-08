package com.smartagrirent.knowledge.service;

import com.smartagrirent.knowledge.dto.request.CreateVarietyRequest;
import com.smartagrirent.knowledge.dto.response.VarietyResponse;

import java.util.List;

public interface VarietyService {
    List<VarietyResponse> getAllVarieties();
    List<VarietyResponse> getVarietiesByCropId(Integer cropId);
    VarietyResponse getVarietyById(Integer id);
    VarietyResponse createVariety(CreateVarietyRequest request);
    void deleteVariety(Integer id);
}
