package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.response.CultivationDashboardResponse;

public interface CultivationDashboardService {

    CultivationDashboardResponse getDashboardStats(Integer workerId, Integer rentalId);
}
