package com.farmely.rental.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "farm-service", url = "${farm-service.url:http://localhost:8082}")
public interface FarmServiceClient {

    @PostMapping("/api/plots/{id}/maintenance/start")
    void startPlotMaintenance(@PathVariable("id") Integer plotId);
}
