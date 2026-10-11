package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.CreateServiceRequest;
import com.farmely.cultivation.dto.request.UpdateServiceRequest;
import com.farmely.cultivation.dto.response.ServiceResponse;
import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceType;

import java.util.List;

public interface ServiceCatalogueService {

    List<ServiceResponse> getAllServices(ServiceType type, ActiveStatus status);

    ServiceResponse getServiceById(Integer serviceId);

    ServiceResponse createService(CreateServiceRequest request);

    ServiceResponse updateService(Integer serviceId, UpdateServiceRequest request);

    void deleteService(Integer serviceId);
}
