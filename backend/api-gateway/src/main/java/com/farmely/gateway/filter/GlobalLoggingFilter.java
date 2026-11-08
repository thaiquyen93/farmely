package com.farmely.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@Slf4j
public class GlobalLoggingFilter implements GlobalFilter, Ordered {

    private static final String START_TIME_KEY = "startTime";
    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        exchange.getAttributes().put(START_TIME_KEY, startTime);

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        ServerHttpRequest request = exchange.getRequest().mutate()
                .header(REQUEST_ID_HEADER, requestId)
                .build();

        exchange.getResponse().getHeaders().add(REQUEST_ID_HEADER, requestId);

        String method = request.getMethod().name();
        String path = request.getURI().getPath();
        String clientIp = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "unknown";

        log.info("[GATEWAY-REQ] [{}] {} {} from IP: {}", requestId, method, path, clientIp);

        return chain.filter(exchange.mutate().request(request).build()).then(Mono.fromRunnable(() -> {
            Long start = exchange.getAttribute(START_TIME_KEY);
            long duration = (start != null) ? (System.currentTimeMillis() - start) : 0;
            int statusCode = exchange.getResponse().getStatusCode() != null 
                    ? exchange.getResponse().getStatusCode().value() 
                    : 500;

            log.info("[GATEWAY-RES] [{}] {} {} -> Status: {} (took {} ms)",
                    requestId, method, path, statusCode, duration);
        }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
