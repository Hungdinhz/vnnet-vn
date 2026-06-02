package com.example.backend_java.controller;

import com.example.backend_java.dto.TokenDto;
import com.example.backend_java.dto.UserCreateDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.User;
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

    public UserController(UserService userService) {
        this.userService = userService;
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
}
