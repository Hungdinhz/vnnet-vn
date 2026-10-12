package com.example.backend_java.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:}")
    private String allowedOriginsConfig;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Danh sách domain/pattern được phép truy cập
        List<String> allowedPatterns = new ArrayList<>(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "https://vnnet-vn.vercel.app",
            "https://*.vercel.app",
            "https://vnnet-vn-java.onrender.com",
            "https://vnnet.onrender.com"
        ));

        // Nạp thêm từ cấu hình / biến môi trường CORS_ALLOWED_ORIGINS nếu có
        if (allowedOriginsConfig != null && !allowedOriginsConfig.isBlank()) {
            for (String origin : allowedOriginsConfig.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !allowedPatterns.contains(trimmed)) {
                    allowedPatterns.add(trimmed);
                }
            }
        }

        // Dùng allowedOriginPatterns hỗ trợ wildcard (*.vercel.app) và tương thích allowCredentials(true)
        configuration.setAllowedOriginPatterns(allowedPatterns);

        // Cho phép các phương thức HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));

        // Cho phép mọi header (đặc biệt Authorization chứa Token, Content-Type, ...)
        configuration.setAllowedHeaders(List.of("*"));

        // Cho phép gửi credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cho phép trình duyệt đọc các headers cần thiết
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Disposition",
            "Content-Type",
            "Content-Length",
            "X-Total-Count"
        ));

        // Cache preflight OPTIONS response trong 1 giờ để giảm bớt request
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
