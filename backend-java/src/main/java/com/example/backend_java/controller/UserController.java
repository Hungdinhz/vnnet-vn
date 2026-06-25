package com.example.backend_java.controller;

import com.example.backend_java.dto.ActivityDataDto;
import com.example.backend_java.dto.TokenDto;
import com.example.backend_java.dto.UserCreateDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.ActivityService;
import com.example.backend_java.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.backend_java.dto.UserUpdateDto;

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
    public ResponseEntity<com.example.backend_java.dto.MessageDto> forgotPassword(
            @Valid @RequestBody com.example.backend_java.dto.ForgotPasswordDto dto) {
        return ResponseEntity.ok(userService.forgotPassword(dto.getEmail()));
    }

    // POST /users/reset-password - Đặt lại mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<com.example.backend_java.dto.MessageDto> resetPassword(
            @Valid @RequestBody com.example.backend_java.dto.ResetPasswordDto dto) {
        return ResponseEntity.ok(userService.resetPassword(dto));
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

    // GET /users/ - Danh sách tất cả user
    @GetMapping({"", "/"})
    public ResponseEntity<List<UserResponseDto>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /users/{user_id} - Lấy user theo ID
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    // GET /users/{userId}/activity - Lấy tần suất hoạt động 30 ngày
    @GetMapping("/{userId}/activity")
    public ResponseEntity<List<ActivityDataDto>> getUserActivity(@PathVariable Long userId) {
        return ResponseEntity.ok(activityService.getUserActivity(userId));
    }
}
