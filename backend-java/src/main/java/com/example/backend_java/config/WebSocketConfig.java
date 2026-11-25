package com.example.backend_java.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;

    @Value("${cors.allowed-origins:}")
    private String allowedOriginsConfig;

    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = new ArrayList<>(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "https://vnnet-vn.vercel.app"
        ));
        if (allowedOriginsConfig != null && !allowedOriginsConfig.isBlank()) {
            for (String origin : allowedOriginsConfig.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !origins.contains(trimmed) && !"*".equals(trimmed)) {
                    origins.add(trimmed);
                }
            }
        }
        String[] allowedArray = origins.toArray(new String[0]);

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedArray)
                .withSockJS();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedArray);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}
