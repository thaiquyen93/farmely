package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.ConfirmHarvestRequest;
import com.farmely.cultivation.dto.request.RecordHarvestRequest;
import com.farmely.cultivation.dto.response.HarvestResultResponse;

import java.util.List;

public interface HarvestResultService {

    List<HarvestResultResponse> getAllHarvests(Integer rentalId, Boolean customerConfirmed);

    HarvestResultResponse getHarvestById(Integer harvestId);

    HarvestResultResponse recordHarvest(RecordHarvestRequest request);

    HarvestResultResponse confirmHarvest(Integer harvestId, ConfirmHarvestRequest request);
}
