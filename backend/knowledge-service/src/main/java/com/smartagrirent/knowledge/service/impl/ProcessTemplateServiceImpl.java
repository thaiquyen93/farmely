package com.smartagrirent.knowledge.service.impl;

import com.smartagrirent.knowledge.dto.request.CreateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.request.CreateTemplateStepRequest;
import com.smartagrirent.knowledge.dto.request.UpdateProcessTemplateRequest;
import com.smartagrirent.knowledge.dto.response.ProcessTemplateResponse;
import com.smartagrirent.knowledge.dto.response.TemplateStepResponse;
import com.smartagrirent.knowledge.entity.ProcessTemplate;
import com.smartagrirent.knowledge.entity.TemplateStep;
import com.smartagrirent.knowledge.exception.ResourceNotFoundException;
import com.smartagrirent.knowledge.repository.ProcessTemplateRepository;
import com.smartagrirent.knowledge.repository.TemplateStepRepository;
import com.smartagrirent.knowledge.repository.VarietyRepository;
import com.smartagrirent.knowledge.service.ProcessTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcessTemplateServiceImpl implements ProcessTemplateService {

    private final ProcessTemplateRepository templateRepository;
    private final TemplateStepRepository stepRepository;
    private final VarietyRepository varietyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProcessTemplateResponse> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProcessTemplateResponse> getTemplatesByVarietyId(Integer varietyId) {
        return templateRepository.findByVarietyId(varietyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProcessTemplateResponse getTemplateById(Integer id) {
        ProcessTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quy trình chuẩn với ID: " + id));
        return mapToResponse(template);
    }

    @Override
    @Transactional
    public ProcessTemplateResponse createTemplate(CreateProcessTemplateRequest request) {
        // Kiểm tra giống cây tồn tại
        varietyRepository.findById(request.getVarietyId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống cây với ID: " + request.getVarietyId()));

        ProcessTemplate template = ProcessTemplate.builder()
                .varietyId(request.getVarietyId())
                .ptCreatedBy(request.getPtCreatedBy() != null ? request.getPtCreatedBy() : 1)
                .version(request.getVersion() != null ? request.getVersion() : "1.0")
                .build();

        ProcessTemplate savedTemplate = templateRepository.save(template);

        if (request.getSteps() != null && !request.getSteps().isEmpty()) {
            List<TemplateStep> steps = new ArrayList<>();
            for (CreateTemplateStepRequest stepReq : request.getSteps()) {
                TemplateStep step = TemplateStep.builder()
                        .templateId(savedTemplate.getTemplateId())
                        .stepOrder(stepReq.getStepOrder())
                        .stepName(stepReq.getStepName())
                        .dayOffset(stepReq.getDayOffset())
                        .durationDays(stepReq.getDurationDays() != null ? stepReq.getDurationDays() : 1)
                        .taskType(stepReq.getTaskType())
                        .description(stepReq.getDescription())
                        .waterRegime(stepReq.getWaterRegime())
                        .nutritionRegime(stepReq.getNutritionRegime())
                        .pestWarning(stepReq.getPestWarning())
                        .materialsNeeded(stepReq.getMaterialsNeeded())
                        .evidenceRequirement(stepReq.getEvidenceRequirement())
                        .inspectionCriteria(stepReq.getInspectionCriteria())
                        .minTemp(stepReq.getMinTemp())
                        .maxTemp(stepReq.getMaxTemp())
                        .minHumidity(stepReq.getMinHumidity())
                        .maxHumidity(stepReq.getMaxHumidity())
                        .build();
                steps.add(step);
            }
            stepRepository.saveAll(steps);
        }

        return getTemplateById(savedTemplate.getTemplateId());
    }

    @Override
    @Transactional
    public ProcessTemplateResponse updateTemplate(Integer id, UpdateProcessTemplateRequest request) {
        ProcessTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quy trình chuẩn với ID: " + id));

        if (request.getVarietyId() != null) {
            varietyRepository.findById(request.getVarietyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giống cây với ID: " + request.getVarietyId()));
            template.setVarietyId(request.getVarietyId());
        }

        if (request.getVersion() != null && !request.getVersion().isBlank()) {
            template.setVersion(request.getVersion());
        }

        templateRepository.save(template);

        if (request.getSteps() != null) {
            // Xóa các bước cũ và lưu các bước mới
            stepRepository.deleteByTemplateId(id);

            List<TemplateStep> newSteps = new ArrayList<>();
            for (CreateTemplateStepRequest stepReq : request.getSteps()) {
                TemplateStep step = TemplateStep.builder()
                        .templateId(id)
                        .stepOrder(stepReq.getStepOrder())
                        .stepName(stepReq.getStepName())
                        .dayOffset(stepReq.getDayOffset())
                        .durationDays(stepReq.getDurationDays() != null ? stepReq.getDurationDays() : 1)
                        .taskType(stepReq.getTaskType())
                        .description(stepReq.getDescription())
                        .waterRegime(stepReq.getWaterRegime())
                        .nutritionRegime(stepReq.getNutritionRegime())
                        .pestWarning(stepReq.getPestWarning())
                        .materialsNeeded(stepReq.getMaterialsNeeded())
                        .evidenceRequirement(stepReq.getEvidenceRequirement())
                        .inspectionCriteria(stepReq.getInspectionCriteria())
                        .minTemp(stepReq.getMinTemp())
                        .maxTemp(stepReq.getMaxTemp())
                        .minHumidity(stepReq.getMinHumidity())
                        .maxHumidity(stepReq.getMaxHumidity())
                        .build();
                newSteps.add(step);
            }
            stepRepository.saveAll(newSteps);
        }

        return getTemplateById(id);
    }

    @Override
    @Transactional
    public void deleteTemplate(Integer id) {
        ProcessTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quy trình chuẩn với ID: " + id));
        stepRepository.deleteByTemplateId(id);
        templateRepository.delete(template);
    }

    private ProcessTemplateResponse mapToResponse(ProcessTemplate template) {
        String varietyName = "";
        if (template.getVariety() != null) {
            varietyName = template.getVariety().getVarietyName();
        } else if (template.getVarietyId() != null) {
            varietyName = varietyRepository.findById(template.getVarietyId())
                    .map(v -> v.getVarietyName())
                    .orElse("");
        }

        List<TemplateStep> steps = stepRepository.findByTemplateIdOrderByStepOrderAsc(template.getTemplateId());
        List<TemplateStepResponse> stepResponses = steps.stream()
                .map(s -> TemplateStepResponse.builder()
                        .stepId(s.getStepId())
                        .templateId(s.getTemplateId())
                        .stepOrder(s.getStepOrder())
                        .stepName(s.getStepName())
                        .dayOffset(s.getDayOffset())
                        .durationDays(s.getDurationDays())
                        .taskType(s.getTaskType())
                        .description(s.getDescription())
                        .waterRegime(s.getWaterRegime())
                        .nutritionRegime(s.getNutritionRegime())
                        .pestWarning(s.getPestWarning())
                        .materialsNeeded(s.getMaterialsNeeded())
                        .evidenceRequirement(s.getEvidenceRequirement())
                        .inspectionCriteria(s.getInspectionCriteria())
                        .minTemp(s.getMinTemp())
                        .maxTemp(s.getMaxTemp())
                        .minHumidity(s.getMinHumidity())
                        .maxHumidity(s.getMaxHumidity())
                        .build())
                .collect(Collectors.toList());

        return ProcessTemplateResponse.builder()
                .templateId(template.getTemplateId())
                .varietyId(template.getVarietyId())
                .varietyName(varietyName)
                .ptCreatedBy(template.getPtCreatedBy())
                .version(template.getVersion())
                .createdAt(template.getCreatedAt())
                .steps(stepResponses)
                .build();
    }
}
