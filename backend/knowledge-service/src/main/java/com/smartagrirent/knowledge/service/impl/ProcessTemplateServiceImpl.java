package com.smartagrirent.knowledge.service.impl;

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
                        .description(s.getDescription())
                        .materialsNeeded(s.getMaterialsNeeded())
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
