package com.example.backend_java.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Tự động gửi request giữ cho máy chủ Render Free Tier không bị ngủ sau 15 phút không hoạt động.
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${RENDER_EXTERNAL_URL:https://vnnet-vn-java.onrender.com}")
    private String externalUrl;

    @Value("${keep-alive.enabled:true}")
    private boolean keepAliveEnabled;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // Chạy mỗi 10 phút (600,000 ms), Render Free Tier sẽ sleep sau 15 phút không có request
    @Scheduled(fixedRate = 600000, initialDelay = 60000)
    public void pingSelf() {
        if (!keepAliveEnabled || externalUrl == null || externalUrl.isBlank()) {
            return;
        }

        String targetUrl = externalUrl.endsWith("/")
                ? externalUrl + "health"
                : externalUrl + "/health";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "VnNet-KeepAlive/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Keep-alive ping to {} returned status {}", targetUrl, response.statusCode());
        } catch (Exception e) {
            log.warn("Keep-alive ping to {} failed: {}", targetUrl, e.getMessage());
        }
    }
}
