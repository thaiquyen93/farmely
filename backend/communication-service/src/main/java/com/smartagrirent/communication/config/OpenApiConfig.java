package com.smartagrirent.communication.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart AgriRent - Communication Service API")
                        .version("1.0.0")
                        .description("Microservice for 1-1 expert consultations, field worker messaging, AI chat and notifications.")
                        .contact(new Contact().name("Farmely Development Team")));
    }
}
