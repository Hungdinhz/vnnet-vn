package com.example.backend_java.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class RootController {

    // GET / HEAD / - Trang chủ
    @RequestMapping(value = "/", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "message", "Xin chào Hùng, Server Spring Boot đã chạy thành công!"
        ));
    }

    // GET / HEAD /health & /ping - Endpoint nhẹ cho Keep-Alive & kiểm tra trạng thái máy chủ
    @RequestMapping(value = {"/health", "/ping"}, method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
