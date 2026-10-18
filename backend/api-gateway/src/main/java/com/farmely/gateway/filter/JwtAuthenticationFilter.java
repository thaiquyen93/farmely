package com.farmely.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // Các đường dẫn công khai không bắt buộc phải có JWT Token
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/**",
            "/api/plots/marketplace/**",
            "/api/plots/**",            // Khách có thể xem chi tiết thửa đất
            "/api/v1/plots/**",
            "/api/lands/**",            // Khách có thể xem danh sách nông trại
            "/api/v1/lands/**",
            "/api/crops/**",            // Danh mục cây trồng
            "/api/varieties/**",        // Danh mục giống cây
            "/api/templates/**",        // Quy trình canh tác
            "/api/services",           // Khách chưa thuê đất vẫn được xem danh mục dịch vụ
            "/api/compatibility/**",
            "/api/site-visits/**",      // Khách vãng lai có thể đăng ký tham quan
            "/api/v1/site-visits/**",
            "/api/v1/payments/vnpay/return",
            "/api/sensors/**",          // IoT Sensor Telemetry & SSE Stream
            "/actuator/**",
            "/fallback/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Cho phép đi qua nếu là request OPTIONS (CORS preflight)
        if (request.getMethod().name().equalsIgnoreCase("OPTIONS")) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        boolean hasBearerToken = (authHeader != null && authHeader.startsWith("Bearer "));
        boolean isPublic = isPublicEndpoint(path);

        if (!hasBearerToken) {
            if (isPublic) {
                return chain.filter(exchange);
            }
            log.warn("Truy cập bị từ chối: Đường dẫn {} yêu cầu Authorization Header", path);
            return onError(exchange, "Yêu cầu cần có Access Token (Authorization: Bearer <token>)", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = validateAndExtractClaims(token);
            Object userId = claims.get("userId");
            Object role = claims.get("role");
            String email = claims.getSubject();
            Object fullName = claims.get("fullName");

            // Chuyển tiếp thông tin xác thực xuống các microservice nội bộ qua Header
            ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate();
            if (userId != null) requestBuilder.header("X-User-Id", String.valueOf(userId));
            if (role != null) requestBuilder.header("X-User-Role", String.valueOf(role));
            if (email != null) requestBuilder.header("X-User-Email", email);
            if (fullName != null) requestBuilder.header("X-User-Name", String.valueOf(fullName));

            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        } catch (Exception ex) {
            log.error("Token xác thực không hợp lệ cho path {}: {}", path, ex.getMessage());
            if (isPublic) {
                // Nếu là endpoint công khai thì vẫn cho qua nếu token hỏng/hết hạn
                return chain.filter(exchange);
            }
            return onError(exchange, "Access Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicEndpoint(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Claims validateAndExtractClaims(String token) {
        SecretKey key = getSigningKey();
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String errMessage, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String jsonError = String.format(
                "{\"success\":false,\"message\":\"%s\",\"timestamp\":\"%s\"}",
                errMessage,
                OffsetDateTime.now()
        );

        byte[] bytes = jsonError.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return 0; // Chạy ngay sau GlobalLoggingFilter
    }
}
