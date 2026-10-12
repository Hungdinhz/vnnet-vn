package com.example.backend_java.service;

import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.dto.user.UserUpdateDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.mapper.UserMapper;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.util.PasswordValidationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final UserMapper userMapper;

    // Delegations to AuthService for backward compatibility
    public UserResponseDto registerUser(UserCreateDto dto) {
        return authService.registerUser(dto);
    }

    public TokenDto login(String usernameOrEmail, String password) {
        return authService.login(usernameOrEmail, password);
    }

    public MessageDto forgotPassword(String email) {
        return authService.forgotPassword(email);
    }

    public MessageDto resetPassword(ResetPasswordDto dto) {
        return authService.resetPassword(dto);
    }

    public GoogleAuthResponseDto googleLogin(GoogleLoginDto dto) {
        return authService.googleLogin(dto);
    }

    public UserResponseDto googleRegister(GoogleRegisterDto dto) {
        return authService.googleRegister(dto);
    }

    public TokenDto verifyEmail(VerifyOtpDto dto) {
        return authService.verifyEmail(dto);
    }

    public MessageDto resendOtp(ResendOtpDto dto) {
        return authService.resendOtp(dto);
    }

    // Profile & User management methods
    public UserResponseDto getCurrentUser(User user) {
        return userMapper.toResponseDto(user);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    public UserResponseDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return userMapper.toResponseDto(user);
    }

    public UserResponseDto updateProfile(User currentUser, UserUpdateDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty()) {
            if (!user.getUsername().equals(dto.getUsername()) && userRepository.existsByUsername(dto.getUsername())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username này đã được sử dụng!");
            }
            user.setUsername(dto.getUsername());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getCoverUrl() != null) {
            user.setCoverUrl(dto.getCoverUrl());
        }
        if (dto.getBio() != null) {
            user.setBio(dto.getBio());
        }
        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getLocation() != null) {
            user.setLocation(dto.getLocation());
        }
        if (dto.getWorkplace() != null) {
            user.setWorkplace(dto.getWorkplace());
        }
        if (dto.getWebsite() != null) {
            user.setWebsite(dto.getWebsite());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }

        user = userRepository.save(user);
        return userMapper.toResponseDto(user);
    }

    public MessageDto changePassword(User currentUser, ChangePasswordDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác!");
        }

        PasswordValidationUtil.validate(dto.getNewPassword());

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new MessageDto("Đổi mật khẩu thành công!");
    }
}
