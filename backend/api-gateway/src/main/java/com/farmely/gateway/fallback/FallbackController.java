package com.farmely.gateway.fallback;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/service-unavailable")
    public Mono<ResponseEntity<Map<String, Object>>> serviceUnavailableFallback() {
        Map<String, Object> response = Map.of(
                "success", false,
                "message", "Dịch vụ hiện đang bận hoặc tạm thời không khả dụng. Vui lòng thử lại sau.",
                "timestamp", OffsetDateTime.now().toString()
        );
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }
}
