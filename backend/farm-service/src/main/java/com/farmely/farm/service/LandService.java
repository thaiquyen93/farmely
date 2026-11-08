package com.farmely.farm.service;

import com.farmely.farm.dto.LandDetailResponse;
import com.farmely.farm.dto.LandRequest;
import com.farmely.farm.dto.LandResponse;

import java.util.List;

public interface LandService {

    List<LandResponse> getAllLands(String search);

    LandDetailResponse getLandById(Integer landId);

    LandResponse createLand(LandRequest request);

    LandResponse updateLand(Integer landId, LandRequest request);

    void deleteLand(Integer landId);
}
