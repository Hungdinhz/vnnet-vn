package com.example.backend_java.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    // GET / - Trang chủ (giống Python)
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of("message", "Xin chào Hùng, Server Spring Boot đã chạy thành công!"));
    }
}
