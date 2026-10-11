package com.farmely.cultivation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI cultivationServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Farmely - Cultivation Service API")
                        .description("API Quản lý Kế hoạch Canh tác, Tác vụ Hiện trường, Nhật ký Nông trại, Sự cố & Thu hoạch")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Farmely Platform Team")
                                .email("dev@farmely.vn"))
                        .license(new License().name("Apache 2.0")));
    }
}
