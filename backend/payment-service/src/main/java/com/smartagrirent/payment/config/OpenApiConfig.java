package com.smartagrirent.payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI paymentOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Farmely Payment & VietQR Service API")
                        .description("Microservice xử lý thanh toán, VietQR và sổ cái giao dịch tài chính cho Farmely")
                        .version("1.0.0"));
    }
}
