package com.example.backend_java.controller;
import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.common.MessageDto;

import com.example.backend_java.dto.user.ActivityDataDto;
import com.example.backend_java.dto.auth.TokenDto;
import com.example.backend_java.dto.auth.UserCreateDto;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.ActivityService;
import com.example.backend_java.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.backend_java.dto.user.UserUpdateDto;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final ActivityService activityService;

    public UserController(UserService userService, ActivityService activityService) {
        this.userService = userService;
        this.activityService = activityService;
    }

    // POST /users/register - Đăng ký
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody UserCreateDto dto) {
        return ResponseEntity.ok(userService.registerUser(dto));
    }

    // POST /users/login - Đăng nhập (frontend gửi form-urlencoded)
    @PostMapping("/login")
    public ResponseEntity<TokenDto> login(
            @RequestParam("username") String username,
            @RequestParam("password") String password) {
        return ResponseEntity.ok(userService.login(username, password));
    }

    // POST /users/forgot-password - Quên mật khẩu
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageDto> forgotPassword(
            @Valid @RequestBody ForgotPasswordDto dto) {
        return ResponseEntity.ok(userService.forgotPassword(dto.getEmail()));
    }

    // POST /users/reset-password - Đặt lại mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<MessageDto> resetPassword(
            @Valid @RequestBody ResetPasswordDto dto) {
        return ResponseEntity.ok(userService.resetPassword(dto));
    }

    // POST /users/google - Kiểm tra / Đăng nhập Google
    @PostMapping("/google")
    public ResponseEntity<GoogleAuthResponseDto> googleLogin(@Valid @RequestBody GoogleLoginDto dto) {
        return ResponseEntity.ok(userService.googleLogin(dto));
    }

    // POST /users/google/register - Hoàn tất đăng ký Google (gửi OTP xác thực)
    @PostMapping("/google/register")
    public ResponseEntity<UserResponseDto> googleRegister(@Valid @RequestBody GoogleRegisterDto dto) {
        return ResponseEntity.ok(userService.googleRegister(dto));
    }

    // POST /users/verify-email hoặc /users/verify-otp - Xác thực OTP đăng ký
    @PostMapping({"/verify-email", "/verify-otp"})
    public ResponseEntity<TokenDto> verifyEmail(@Valid @RequestBody VerifyOtpDto dto) {
        return ResponseEntity.ok(userService.verifyEmail(dto));
    }

    // POST /users/resend-otp - Gửi lại mã OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<MessageDto> resendOtp(@Valid @RequestBody ResendOtpDto dto) {
        return ResponseEntity.ok(userService.resendOtp(dto));
    }

    // POST /users/guest/register - Đăng ký tài khoản khách (không cần OTP, trả token ngay)
    @PostMapping("/guest/register")
    public ResponseEntity<TokenDto> registerGuest(@Valid @RequestBody GuestRegisterDto dto) {
        return ResponseEntity.ok(userService.registerGuest(dto));
    }

    // POST /users/guest/forgot-password - Kiểm tra email tài khoản khách (không gửi OTP)
    @PostMapping("/guest/forgot-password")
    public ResponseEntity<MessageDto> guestForgotPassword(@Valid @RequestBody ForgotPasswordDto dto) {
        return ResponseEntity.ok(userService.guestForgotPasswordCheck(dto.getEmail()));
    }

    // POST /users/guest/reset-password - Đổi mật khẩu tài khoản khách trực tiếp
    @PostMapping("/guest/reset-password")
    public ResponseEntity<MessageDto> guestResetPassword(@Valid @RequestBody GuestResetPasswordDto dto) {
        return ResponseEntity.ok(userService.guestResetPassword(dto));
    }

    // GET /users/me - Lấy thông tin user hiện tại (cần token)
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getCurrentUser(currentUser));
    }

    // PUT /users/me - Cập nhật thông tin profile hiện tại (cần token)
    @PutMapping("/me")
    public ResponseEntity<UserResponseDto> updateProfile(
            @RequestBody UserUpdateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(currentUser, dto));
    }

    // PUT /users/change-password - Đổi mật khẩu (cần token)
    @PutMapping("/change-password")
    public ResponseEntity<MessageDto> changePassword(
            @RequestBody ChangePasswordDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.changePassword(currentUser, dto));
    }

    // GET /users/ - Danh sách tất cả user
    @GetMapping({"", "/"})
    public ResponseEntity<List<UserResponseDto>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /users/{identifier} - Lấy user theo ID hoặc username
    @GetMapping("/{identifier}")
    public ResponseEntity<UserResponseDto> getUserByIdOrUsername(
            @PathVariable String identifier,
            Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            currentUserId = ((User) authentication.getPrincipal()).getId();
        }
        return ResponseEntity.ok(userService.getUserByIdOrUsername(identifier, currentUserId));
    }

    // GET /users/{userId}/activity - Lấy tần suất hoạt động 30 ngày
    @GetMapping("/{userId}/activity")
    public ResponseEntity<List<ActivityDataDto>> getUserActivity(@PathVariable Long userId) {
        return ResponseEntity.ok(activityService.getUserActivity(userId));
    }
}
