package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.CompleteCareTaskRequest;
import com.farmely.cultivation.dto.request.CreateCareTaskRequest;
import com.farmely.cultivation.dto.request.GenerateTasksFromTemplateRequest;
import com.farmely.cultivation.dto.request.UpdateCareTaskRequest;
import com.farmely.cultivation.dto.response.CareTaskResponse;

import java.time.LocalDate;
import java.util.List;

public interface CareTaskService {

    List<CareTaskResponse> getAllTasks(Integer workerId, Integer rentalId, String status, LocalDate date);

    CareTaskResponse getTaskById(Integer taskId);

    CareTaskResponse createTask(CreateCareTaskRequest request);

    CareTaskResponse updateTask(Integer taskId, UpdateCareTaskRequest request);

    CareTaskResponse assignTask(Integer taskId, Integer workerId);

    CareTaskResponse startTask(Integer taskId);

    CareTaskResponse completeTask(Integer taskId, CompleteCareTaskRequest request);

    List<CareTaskResponse> generateTasksFromTemplate(GenerateTasksFromTemplateRequest request);

    long checkAndMarkOverdueTasks();
}
