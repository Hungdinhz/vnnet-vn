package com.example.backend_java.service;

import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.dto.user.UserUpdateDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.mapper.UserMapper;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.util.PasswordValidationUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final UserMapper userMapper;
    private final com.example.backend_java.repository.UserBlockRepository userBlockRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthService authService,
                       UserMapper userMapper,
                       com.example.backend_java.repository.UserBlockRepository userBlockRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.userMapper = userMapper;
        this.userBlockRepository = userBlockRepository;
    }

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

    public TokenDto registerGuest(GuestRegisterDto dto) {
        return authService.registerGuest(dto);
    }

    public MessageDto guestForgotPasswordCheck(String email) {
        return authService.guestForgotPasswordCheck(email);
    }

    public MessageDto guestResetPassword(GuestResetPasswordDto dto) {
        return authService.guestResetPassword(dto);
    }

    public MessageDto logout(User currentUser) {
        return authService.logout(currentUser);
    }

    // Profile & User management methods
    public UserResponseDto getCurrentUser(User user) {
        return userMapper.toSelfResponseDto(user);
    }

    public List<UserResponseDto> getAllUsers() {
        return getAllUsers(0, 50);
    }

    public List<UserResponseDto> getAllUsers(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        return userRepository.findAll(org.springframework.data.domain.PageRequest.of(safePage, safeSize))
                .getContent().stream()
                .map(userMapper::toPublicResponseDto)
                .collect(Collectors.toList());
    }

    public UserResponseDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return userMapper.toPublicResponseDto(user);
    }

    public UserResponseDto getUserByIdOrUsername(String identifier) {
        return getUserByIdOrUsername(identifier, null);
    }

    public UserResponseDto getUserByIdOrUsername(String identifier, Long currentUserId) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User identifier is required");
        }
        User user = null;
        try {
            Long userId = Long.parseLong(identifier.trim());
            user = userRepository.findById(userId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (user == null) {
            user = userRepository.findByUsernameIgnoreCase(identifier.trim())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        }

        boolean isSelf = currentUserId != null && currentUserId.equals(user.getId());
        UserResponseDto dto = isSelf ? userMapper.toSelfResponseDto(user) : userMapper.toPublicResponseDto(user);
        if (currentUserId != null && !isSelf) {
            dto.setIsBlockedByMe(userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, user.getId()));
            dto.setIsBlockedByThem(userBlockRepository.existsByBlockerIdAndBlockedId(user.getId(), currentUserId));
        } else {
            dto.setIsBlockedByMe(false);
            dto.setIsBlockedByThem(false);
        }
        return dto;
    }

    public UserResponseDto updateProfile(User currentUser, UserUpdateDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty()) {
            String newUsername = dto.getUsername().trim();
            if (newUsername.length() < 3 || newUsername.length() > 50) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập phải từ 3 đến 50 ký tự!");
            }
            if (newUsername.matches("^\\d+$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập không được chỉ gồm chữ số!");
            }
            if (!newUsername.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsernameIgnoreCase(newUsername)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
            }
            user.setUsername(newUsername);
        }
        if (dto.getAvatarUrl() != null) {
            com.example.backend_java.util.UrlValidationUtil.validateHttpUrlOrNull(dto.getAvatarUrl(), "avatarUrl");
            user.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getCoverUrl() != null) {
            com.example.backend_java.util.UrlValidationUtil.validateHttpUrlOrNull(dto.getCoverUrl(), "coverUrl");
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
            com.example.backend_java.util.UrlValidationUtil.validateHttpUrlOrNull(dto.getWebsite(), "website");
            user.setWebsite(dto.getWebsite());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getIsPrivate() != null) {
            user.setIsPrivate(dto.getIsPrivate());
        }

        user = userRepository.save(user);
        return userMapper.toSelfResponseDto(user);
    }

    public MessageDto changePassword(User currentUser, ChangePasswordDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác!");
        }

        PasswordValidationUtil.validate(dto.getNewPassword());

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);

        return new MessageDto("Đổi mật khẩu thành công!");
    }
}
