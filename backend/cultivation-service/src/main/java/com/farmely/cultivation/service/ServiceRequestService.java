package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.AssignWorkerRequest;
import com.farmely.cultivation.dto.request.BookServiceRequest;
import com.farmely.cultivation.dto.response.ServiceRequestResponse;
import com.farmely.cultivation.entity.RequestStatus;

import java.util.List;

public interface ServiceRequestService {

    List<ServiceRequestResponse> getAllRequests(Integer rentalId, RequestStatus status);

    ServiceRequestResponse getRequestById(Integer requestId);

    ServiceRequestResponse bookService(BookServiceRequest request);

    ServiceRequestResponse assignWorker(Integer requestId, AssignWorkerRequest request);

    ServiceRequestResponse updateStatus(Integer requestId, RequestStatus status);
}
