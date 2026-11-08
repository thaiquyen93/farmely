package com.smartagrirent.knowledge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.upload-dir:uploads/documents}")
    private String uploadDir;

    @Value("${storage.docs-dir:d:/S5/Farmely/docs}")
    private String docsDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath.endsWith("/") ? uploadPath : uploadPath + "/");

        String docsPath = Paths.get(docsDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/docs/**")
                .addResourceLocations(docsPath.endsWith("/") ? docsPath : docsPath + "/");
    }
}
