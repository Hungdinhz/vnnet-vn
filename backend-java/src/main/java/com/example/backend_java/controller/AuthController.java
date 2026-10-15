package com.example.backend_java.controller;

import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /auth/register - Đăng ký
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody UserCreateDto dto) {
        return ResponseEntity.ok(authService.registerUser(dto));
    }

    // POST /auth/login - Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<TokenDto> login(
            @RequestParam("username") String username,
            @RequestParam("password") String password) {
        return ResponseEntity.ok(authService.login(username, password));
    }

    // POST /auth/forgot-password - Quên mật khẩu
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageDto> forgotPassword(@Valid @RequestBody ForgotPasswordDto dto) {
        return ResponseEntity.ok(authService.forgotPassword(dto.getEmail()));
    }

    // POST /auth/reset-password - Đặt lại mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<MessageDto> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        return ResponseEntity.ok(authService.resetPassword(dto));
    }

    // POST /auth/google - Kiểm tra / Đăng nhập Google
    @PostMapping("/google")
    public ResponseEntity<GoogleAuthResponseDto> googleLogin(@Valid @RequestBody GoogleLoginDto dto) {
        return ResponseEntity.ok(authService.googleLogin(dto));
    }

    // POST /auth/google/register - Hoàn tất đăng ký Google
    @PostMapping("/google/register")
    public ResponseEntity<UserResponseDto> googleRegister(@Valid @RequestBody GoogleRegisterDto dto) {
        return ResponseEntity.ok(authService.googleRegister(dto));
    }

    // POST /auth/verify-email hoặc /auth/verify-otp - Xác thực OTP đăng ký
    @PostMapping({"/verify-email", "/verify-otp"})
    public ResponseEntity<TokenDto> verifyEmail(@Valid @RequestBody VerifyOtpDto dto) {
        return ResponseEntity.ok(authService.verifyEmail(dto));
    }

    // POST /auth/resend-otp - Gửi lại mã OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<MessageDto> resendOtp(@Valid @RequestBody ResendOtpDto dto) {
        return ResponseEntity.ok(authService.resendOtp(dto));
    }
}
