package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminAuthDtos.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login-step1")
    public LoginStep1Response loginStep1(@Valid @RequestBody LoginStep1Request request) {
        return adminAuthService.loginStep1(request);
    }

    @PostMapping("/login-step2")
    public AdminTokenResponse loginStep2(@Valid @RequestBody LoginStep2Request request) {
        return adminAuthService.loginStep2(request);
    }

    @GetMapping("/me")
    public AdminProfileDto me(@AuthenticationPrincipal User currentAdmin) {
        return adminAuthService.getProfile(currentAdmin);
    }

    @PostMapping("/logout")
    public MessageDto logout(@AuthenticationPrincipal User currentAdmin) {
        return adminAuthService.logout(currentAdmin);
    }
}
