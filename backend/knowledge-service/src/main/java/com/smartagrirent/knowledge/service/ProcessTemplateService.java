package com.smartagrirent.knowledge.service;

import com.smartagrirent.knowledge.dto.response.ProcessTemplateResponse;

import java.util.List;

public interface ProcessTemplateService {
    List<ProcessTemplateResponse> getAllTemplates();
    List<ProcessTemplateResponse> getTemplatesByVarietyId(Integer varietyId);
    ProcessTemplateResponse getTemplateById(Integer id);
}
