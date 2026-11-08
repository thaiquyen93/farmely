package com.farmely.rental.service;

import com.farmely.rental.dto.request.CreateReservationRequest;
import com.farmely.rental.dto.response.ContractResponse;
import com.farmely.rental.entity.ContractStatus;

import java.util.List;

public interface ContractService {

    ContractResponse createReservation(CreateReservationRequest request);

    ContractResponse extendGracePeriod(Integer contractId);

    ContractResponse activateContract(Integer contractId);

    ContractResponse cancelUnpaidContract(Integer contractId);

    ContractResponse getContractById(Integer contractId);

    ContractResponse getContractByNumber(String contractNumber);

    List<ContractResponse> getAllContracts(Integer renterId, ContractStatus status);
}
