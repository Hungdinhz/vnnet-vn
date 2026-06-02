package com.example.backend_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Danh sách các domain được phép gọi API (giống Python origins)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",         // Frontend local
            "https://vnnet.onrender.com",    // Backend deploy (nếu cần)
            "https://vnnet-vn.vercel.app"    // Frontend deploy trên Vercel
        ));

        // Cho phép mọi phương thức
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Cho phép mọi header (đặc biệt Authorization chứa Token)
        configuration.setAllowedHeaders(List.of("*"));

        // Cho phép gửi credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
