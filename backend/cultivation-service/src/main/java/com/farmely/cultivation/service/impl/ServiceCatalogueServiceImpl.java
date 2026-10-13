package com.farmely.cultivation.service.impl;

import com.farmely.cultivation.dto.request.CreateServiceRequest;
import com.farmely.cultivation.dto.request.UpdateServiceRequest;
import com.farmely.cultivation.dto.response.ServiceResponse;
import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceEntity;
import com.farmely.cultivation.entity.ServiceType;
import com.farmely.cultivation.exception.ResourceNotFoundException;
import com.farmely.cultivation.repository.ServiceRepository;
import com.farmely.cultivation.service.ServiceCatalogueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCatalogueServiceImpl implements ServiceCatalogueService {

    private final ServiceRepository serviceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponse> getAllServices(ServiceType type, ActiveStatus status) {
        List<ServiceEntity> entities;
        if (type != null && status != null) {
            entities = serviceRepository.findByServiceTypeAndStatus(type, status);
        } else if (type != null) {
            entities = serviceRepository.findByServiceType(type);
        } else if (status != null) {
            entities = serviceRepository.findByStatus(status);
        } else {
            entities = serviceRepository.findAll();
        }

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Integer serviceId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ với mã: " + serviceId));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public ServiceResponse createService(CreateServiceRequest request) {
        ServiceEntity entity = ServiceEntity.builder()
                .serviceName(request.getServiceName())
                .serviceType(request.getServiceType())
                .price(request.getPrice())
                .unit(request.getUnit())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : ActiveStatus.ACTIVE)
                .build();

        ServiceEntity saved = serviceRepository.save(entity);
        if (saved.getServiceCode() == null || saved.getServiceCode().isBlank()) {
            saved.setServiceCode(String.format("S%02d", saved.getServiceId()));
            saved = serviceRepository.save(saved);
        }
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ServiceResponse updateService(Integer serviceId, UpdateServiceRequest request) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ với mã: " + serviceId));

        if (request.getServiceName() != null && !request.getServiceName().isBlank()) {
            entity.setServiceName(request.getServiceName());
        }
        if (request.getServiceType() != null) {
            entity.setServiceType(request.getServiceType());
        }
        if (request.getPrice() != null) {
            entity.setPrice(request.getPrice());
        }
        if (request.getUnit() != null) {
            entity.setUnit(request.getUnit());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        ServiceEntity updated = serviceRepository.save(entity);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteService(Integer serviceId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ với mã: " + serviceId));
        // Soft delete by setting status INACTIVE
        entity.setStatus(ActiveStatus.INACTIVE);
        serviceRepository.save(entity);
    }

    private ServiceResponse mapToResponse(ServiceEntity entity) {
        return ServiceResponse.builder()
                .serviceId(entity.getServiceId())
                .serviceCode(entity.getServiceCode())
                .serviceName(entity.getServiceName())
                .serviceType(entity.getServiceType())
                .price(entity.getPrice())
                .unit(entity.getUnit())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .build();
    }
}
