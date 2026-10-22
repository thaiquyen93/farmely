package com.smartagrirent.knowledge.service;

import com.smartagrirent.knowledge.dto.request.CreateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.request.UpdateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.response.ProcessTemplateResponse;

import java.util.List;

public interface ProcessTemplateService {
    List<ProcessTemplateResponse> getAllTemplates();
    List<ProcessTemplateResponse> getTemplatesByVarietyId(Integer varietyId);
    ProcessTemplateResponse getTemplateById(Integer id);
    ProcessTemplateResponse createTemplate(CreateProcessTemplateRequest request);
    ProcessTemplateResponse updateTemplate(Integer id, UpdateProcessTemplateRequest request);
    void deleteTemplate(Integer id);
}
