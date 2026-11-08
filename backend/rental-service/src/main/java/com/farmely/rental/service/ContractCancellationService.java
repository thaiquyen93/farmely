package com.farmely.rental.service;

import com.farmely.rental.dto.request.CreateCancellationRequest;
import com.farmely.rental.dto.response.ContractCancellationResponse;
import com.farmely.rental.entity.CancelStatus;

import java.util.List;

public interface ContractCancellationService {

    ContractCancellationResponse requestCancellation(CreateCancellationRequest request);

    ContractCancellationResponse approveCancellation(Integer cancellationId);

    ContractCancellationResponse rejectCancellation(Integer cancellationId);

    ContractCancellationResponse getCancellationById(Integer cancellationId);

    List<ContractCancellationResponse> getAllCancellations(CancelStatus status);
}
