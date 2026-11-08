package com.farmely.rental.client;

import lombok.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDate;

@FeignClient(name = "cultivation-service", url = "${cultivation-service.url:http://localhost:8086}")
public interface CultivationServiceClient {

    @PostMapping("/api/care-tasks/generate-from-template")
    void generateTasksFromTemplate(@RequestBody GenerateTasksRequest request);

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    class GenerateTasksRequest {
        private Integer rentalId;
        private Integer templateId;
        private LocalDate startDate;
        private Integer defaultWorkerId;
    }
}
