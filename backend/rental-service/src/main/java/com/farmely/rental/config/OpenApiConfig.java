package com.farmely.rental.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI rentalServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Farmely - Rental & Contract Service API")
                        .description("API Quản lý Đặt thuê Thửa đất (Reservation), Hợp đồng (Contract), Gia hạn, Hủy hợp đồng & Thăm quan thực địa")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Farmely Platform Team")
                                .email("dev@farmely.vn"))
                        .license(new License().name("Apache 2.0")));
    }
}
