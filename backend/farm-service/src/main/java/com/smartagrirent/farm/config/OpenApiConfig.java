package com.smartagrirent.farm.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Farmely Farm & Site Visit Service API")
                        .description("API quản lý nông trại, thửa đất và lịch hẹn đi xem thực địa (SCR-PUB-05)")
                        .version("1.0.0"));
    }
}
