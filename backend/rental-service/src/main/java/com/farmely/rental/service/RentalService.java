package com.farmely.rental.service;

import com.farmely.rental.dto.request.CheckAvailabilityRequest;
import com.farmely.rental.dto.request.RenewRentalRequest;
import com.farmely.rental.dto.response.AvailabilityCheckResponse;
import com.farmely.rental.dto.response.RentalResponse;
import com.farmely.rental.entity.RentalStatus;

import java.util.List;

public interface RentalService {

    AvailabilityCheckResponse checkAvailability(CheckAvailabilityRequest request);

    RentalResponse getRentalById(Integer rentalId);

    List<RentalResponse> getAllRentals(Integer renterId, Integer plotId, Integer contractId, RentalStatus status);

    RentalResponse renewRental(Integer rentalId, RenewRentalRequest request);
}
