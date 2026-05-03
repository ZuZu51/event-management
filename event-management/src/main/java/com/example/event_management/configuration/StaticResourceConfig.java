package com.example.event_management.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map requests to /uploads/** to the local uploads directory (relative to working dir)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
