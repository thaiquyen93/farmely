package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.CompleteCareTaskRequest;
import com.farmely.cultivation.dto.request.CreateCareTaskRequest;
import com.farmely.cultivation.dto.request.GenerateTasksFromTemplateRequest;
import com.farmely.cultivation.dto.request.UpdateCareTaskRequest;
import com.farmely.cultivation.dto.response.CareTaskResponse;
import com.farmely.cultivation.entity.*;
import com.farmely.cultivation.exception.BadRequestException;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.*;
import com.farmely.cultivation.service.CareTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CareTaskServiceImpl implements CareTaskService {

    private final CareTaskRepository careTaskRepository;
    private final FarmDiaryRepository farmDiaryRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final RentalReferenceRepository rentalReferenceRepository;
    private final UserReferenceRepository userReferenceRepository;
    private final TemplateStepReferenceRepository templateStepReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CareTaskResponse> getAllTasks(Integer workerId, Integer rentalId, String status, LocalDate date) {
        List<CareTaskEntity> list;

        if (workerId != null && date != null) {
            list = careTaskRepository.findByTaskAssignedToAndDueDate(workerId, date);
        } else if (workerId != null) {
            list = careTaskRepository.findByTaskAssignedToOrderByDueDateAsc(workerId);
        } else if (rentalId != null) {
            list = careTaskRepository.findByRentalIdOrderByDueDateAsc(rentalId);
        } else if (date != null) {
            list = careTaskRepository.findByDueDate(date);
        } else {
            list = careTaskRepository.findAll();
        }

        // Filter status if provided
        if (status != null && !status.isBlank()) {
            String upper = status.trim().toUpperCase();
            if (upper.equals("OVERDUE")) {
                list = list.stream()
                        .filter(t -> t.getStatus() != TaskStatus.DONE &&
                                t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()))
                        .toList();
            } else {
                TaskStatus targetStatus = TaskStatus.fromString(upper);
                list = list.stream()
                        .filter(t -> t.getStatus() == targetStatus)
                        .toList();
            }
        }

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CareTaskResponse getTaskById(Integer taskId) {
        CareTaskEntity task = careTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với mã: " + taskId));
        return mapToResponse(task);
    }

    @Override
    @Transactional
    public CareTaskResponse createTask(CreateCareTaskRequest request) {
        CareTaskEntity task = CareTaskEntity.builder()
                .rentalId(request.getRentalId())
                .stepId(request.getStepId())
                .serviceRequestId(request.getServiceRequestId())
                .taskAssignedTo(request.getTaskAssignedTo())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.PENDING)
                .evidenceImageUrl(request.getEvidenceImageUrl())
                .notes(request.getNotes())
                .build();

        CareTaskEntity saved = careTaskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CareTaskResponse updateTask(Integer taskId, UpdateCareTaskRequest request) {
        CareTaskEntity task = careTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với mã: " + taskId));

        if (request.getTaskAssignedTo() != null) {
            task.setTaskAssignedTo(request.getTaskAssignedTo());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getEvidenceImageUrl() != null) {
            task.setEvidenceImageUrl(request.getEvidenceImageUrl());
        }
        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }

        CareTaskEntity saved = careTaskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CareTaskResponse assignTask(Integer taskId, Integer workerId) {
        CareTaskEntity task = careTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với mã: " + taskId));

        task.setTaskAssignedTo(workerId);
        CareTaskEntity saved = careTaskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CareTaskResponse startTask(Integer taskId) {
        CareTaskEntity task = careTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với mã: " + taskId));

        task.setStatus(TaskStatus.IN_PROG);
        CareTaskEntity saved = careTaskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CareTaskResponse completeTask(Integer taskId, CompleteCareTaskRequest request) {
        CareTaskEntity task = careTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với mã: " + taskId));

        // BR16 Validation: Mandatory photo proof
        if (request.getEvidenceImageUrl() == null || request.getEvidenceImageUrl().trim().isEmpty()) {
            throw new BadRequestException("Bắt buộc phải có ảnh minh chứng hiện trường khi xác nhận hoàn thành công việc (Quy định BR16)");
        }

        task.setStatus(TaskStatus.DONE);
        task.setEvidenceImageUrl(request.getEvidenceImageUrl());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            task.setNotes(request.getNotes());
        }

        CareTaskEntity saved = careTaskRepository.save(task);

        // BR17: Automatic synchronization to Farm Diary
        if (Boolean.TRUE.equals(request.getSyncToDiary())) {
            boolean diaryExists = farmDiaryRepository.existsByTaskId(saved.getTaskId());
            if (!diaryExists) {
                String diaryContent = (saved.getNotes() != null && !saved.getNotes().trim().isEmpty())
                        ? saved.getNotes()
                        : "Hoàn tất nhiệm vụ chăm sóc hiện trường tại thửa đất.";

                FarmDiaryEntity diary = FarmDiaryEntity.builder()
                        .rentalId(saved.getRentalId())
                        .taskId(saved.getTaskId())
                        .content(diaryContent)
                        .imageUrl(saved.getEvidenceImageUrl())
                        .build();
                farmDiaryRepository.save(diary);
                log.info("Auto synced care task #{} to farm diary for rental #{}", saved.getTaskId(), saved.getRentalId());
            }
        }

        // If this task was part of a service request, mark request as DONE
        if (saved.getServiceRequestId() != null) {
            serviceRequestRepository.findById(saved.getServiceRequestId()).ifPresent(req -> {
                req.setStatus(RequestStatus.DONE);
                serviceRequestRepository.save(req);
            });
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<CareTaskResponse> generateTasksFromTemplate(GenerateTasksFromTemplateRequest request) {
        RentalReference rental = rentalReferenceRepository.findById(request.getRentalId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt thuê với mã: " + request.getRentalId()));

        LocalDate baseDate = (request.getStartDate() != null)
                ? request.getStartDate()
                : (rental.getStartDate() != null ? rental.getStartDate() : LocalDate.now());

        Integer templateId = request.getTemplateId();
        // Fallback templateId from variety if templateId is not provided
        if (templateId == null && rental.getVariety() != null) {
            templateId = rental.getVariety().getVarietyId();
        }

        if (templateId == null) {
            throw new BadRequestException("Không xác định được mã quy trình (templateId) cho giống cây trồng");
        }

        List<TemplateStepReference> steps = templateStepReferenceRepository.findByTemplateIdOrderByDayOffsetAsc(templateId);
        if (steps.isEmpty()) {
            log.warn("No template steps found for template #{}", templateId);
            return List.of();
        }

        List<CareTaskEntity> createdTasks = new ArrayList<>();
        for (TemplateStepReference step : steps) {
            // Avoid duplicate task generation
            if (careTaskRepository.existsByRentalIdAndStepId(rental.getRentalId(), step.getStepId())) {
                continue;
            }

            LocalDate dueDate = baseDate.plusDays(step.getDayOffset() != null ? step.getDayOffset() : 0);

            CareTaskEntity task = CareTaskEntity.builder()
                    .rentalId(rental.getRentalId())
                    .stepId(step.getStepId())
                    .taskAssignedTo(request.getDefaultWorkerId())
                    .dueDate(dueDate)
                    .status(TaskStatus.PENDING)
                    .notes(step.getStepName() + (step.getDescription() != null ? ": " + step.getDescription() : ""))
                    .build();

            createdTasks.add(careTaskRepository.save(task));
        }

        log.info("Generated {} care tasks from template #{} for rental #{}", createdTasks.size(), templateId, rental.getRentalId());
        return createdTasks.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long checkAndMarkOverdueTasks() {
        return careTaskRepository.countOverdueTasks(LocalDate.now());
    }

    private CareTaskResponse mapToResponse(CareTaskEntity entity) {
        String taskCode = "TSK-" + entity.getTaskId();
        boolean isOverdue = entity.getStatus() != TaskStatus.DONE &&
                entity.getDueDate() != null &&
                entity.getDueDate().isBefore(LocalDate.now());

        String displayStatus;
        if (isOverdue) {
            displayStatus = "OVERDUE";
        } else if (entity.getStatus() == TaskStatus.DONE) {
            displayStatus = "COMPLETED";
        } else if (entity.getStatus() == TaskStatus.IN_PROG) {
            displayStatus = "IN_PROGRESS";
        } else {
            displayStatus = "PENDING";
        }

        String session = (entity.getTaskId() % 2 == 0) ? "AFTERNOON" : "MORNING";

        String title = entity.getNotes();
        String instructions = entity.getNotes();
        if (entity.getStepId() != null) {
            TemplateStepReference step = templateStepReferenceRepository.findById(entity.getStepId()).orElse(null);
            if (step != null) {
                title = step.getStepName();
                instructions = step.getDescription();
            }
        }

        String workerName = null;
        if (entity.getTaskAssignedTo() != null) {
            UserReference worker = userReferenceRepository.findById(entity.getTaskAssignedTo()).orElse(null);
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

        return CareTaskResponse.builder()
                .taskId(entity.getTaskId())
                .taskCode(taskCode)
                .rentalId(entity.getRentalId())
                .stepId(entity.getStepId())
                .serviceRequestId(entity.getServiceRequestId())
                .taskAssignedTo(entity.getTaskAssignedTo())
                .workerName(workerName)
                .dueDate(entity.getDueDate())
                .session(session)
                .status(entity.getStatus())
                .displayStatus(displayStatus)
                .isOverdue(isOverdue)
                .evidenceImageUrl(entity.getEvidenceImageUrl())
                .notes(entity.getNotes())
                .title(title)
                .instructions(instructions)
                .plotCode(plotCode)
                .plotName(plotName)
                .cropName(cropName)
                .customerName(customerName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
