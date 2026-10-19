package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.AssignWorkerRequest;
import com.farmely.cultivation.dto.request.BookServiceRequest;
import com.farmely.cultivation.dto.response.ServiceRequestResponse;
import com.farmely.cultivation.dto.response.ServiceResponse;
import com.farmely.cultivation.entity.*;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.*;
import com.farmely.cultivation.service.ServiceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceRepository serviceRepository;
    private final CareTaskRepository careTaskRepository;
    private final RentalReferenceRepository rentalReferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getAllRequests(Integer rentalId, RequestStatus status) {
        List<ServiceRequestEntity> list;
        if (rentalId != null && status != null) {
            list = serviceRequestRepository.findByRentalIdAndStatus(rentalId, status);
        } else if (rentalId != null) {
            list = serviceRequestRepository.findByRentalIdOrderByCreatedAtDesc(rentalId);
        } else if (status != null) {
            list = serviceRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = serviceRequestRepository.findAll();
        }

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRequestResponse getRequestById(Integer requestId) {
        ServiceRequestEntity entity = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu dịch vụ với mã: " + requestId));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public ServiceRequestResponse bookService(BookServiceRequest request) {
        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ: " + request.getServiceId()));

        ServiceRequestEntity entity = ServiceRequestEntity.builder()
                .rentalId(request.getRentalId())
                .service(service)
                .scheduledDate(request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now().plusDays(1))
                .status(RequestStatus.PENDING)
                .build();

        ServiceRequestEntity saved = serviceRequestRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ServiceRequestResponse assignWorker(Integer requestId, AssignWorkerRequest request) {
        ServiceRequestEntity entity = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu dịch vụ với mã: " + requestId));

        entity.setStatus(RequestStatus.ASSIGNED);
        if (request.getScheduledDate() != null) {
            entity.setScheduledDate(request.getScheduledDate());
        }
        ServiceRequestEntity saved = serviceRequestRepository.save(entity);

        // Auto create care_task for the worker
        CareTaskEntity task = CareTaskEntity.builder()
                .rentalId(saved.getRentalId())
                .serviceRequestId(saved.getRequestId())
                .taskAssignedTo(request.getWorkerId())
                .dueDate(saved.getScheduledDate() != null ? saved.getScheduledDate() : LocalDate.now())
                .status(TaskStatus.PENDING)
                .notes("Thực hiện dịch vụ: " + saved.getService().getServiceName() +
                        (request.getNotes() != null ? " - " + request.getNotes() : ""))
                .build();
        careTaskRepository.save(task);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ServiceRequestResponse updateStatus(Integer requestId, RequestStatus status) {
        ServiceRequestEntity entity = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu dịch vụ với mã: " + requestId));

        entity.setStatus(status);
        ServiceRequestEntity saved = serviceRequestRepository.save(entity);
        return mapToResponse(saved);
    }

    private ServiceRequestResponse mapToResponse(ServiceRequestEntity entity) {
        ServiceResponse serviceResp = null;
        if (entity.getService() != null) {
            serviceResp = ServiceResponse.builder()
                    .serviceId(entity.getService().getServiceId())
                    .serviceName(entity.getService().getServiceName())
                    .serviceType(entity.getService().getServiceType())
                    .price(entity.getService().getPrice())
                    .unit(entity.getService().getUnit())
                    .description(entity.getService().getDescription())
                    .status(entity.getService().getStatus())
                    .build();
        }

        String plotCode = null;
        String plotName = null;
        String varietyName = null;
        String renterName = null;

        if (entity.getRentalId() != null) {
            RentalReference rental = rentalReferenceRepository.findById(entity.getRentalId()).orElse(null);
            if (rental != null) {
                if (rental.getPlot() != null) {
                    plotCode = rental.getPlot().getPlotCode();
                    plotName = "Thửa " + rental.getPlot().getPlotCode();
                }
                if (rental.getVariety() != null) {
                    varietyName = rental.getVariety().getVarietyName();
                }
            }
        }

        return ServiceRequestResponse.builder()
                .requestId(entity.getRequestId())
                .rentalId(entity.getRentalId())
                .service(serviceResp)
                .scheduledDate(entity.getScheduledDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .plotCode(plotCode)
                .plotName(plotName)
                .varietyName(varietyName)
                .renterName(renterName)
                .build();
    }
}
