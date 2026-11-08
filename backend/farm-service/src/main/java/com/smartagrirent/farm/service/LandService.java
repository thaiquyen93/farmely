package com.smartagrirent.farm.service;

import com.smartagrirent.farm.dto.request.CreateLandRequest;
import com.smartagrirent.farm.dto.response.LandResponse;

import java.util.List;

public interface LandService {

    List<LandResponse> getAllLands();

    LandResponse getLandById(Integer landId);

    LandResponse createLand(CreateLandRequest request);
}
