package com.example.backend_java.service;

import com.example.backend_java.dto.TokenDto;
import com.example.backend_java.dto.UserCreateDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
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
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // Đăng ký user mới (tương đương crud_user.create_user + register_user API)
    public UserResponseDto registerUser(UserCreateDto dto) {
        // Kiểm tra email trùng lặp
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký!");
        }
        // Kiểm tra username trùng lặp
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username này đã được sử dụng!");
        }

        // Băm mật khẩu bằng BCrypt
        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                .build();

        user = userRepository.save(user);
        return toResponseDto(user);
    }

    // Đăng nhập (tương đương authenticate_user + login_for_access_token)
    public TokenDto login(String usernameOrEmail, String password) {
        // Tìm user bằng email (Python dùng email trong OAuth2PasswordRequestForm.username)
        User user = userRepository.findByEmail(usernameOrEmail).orElse(null);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        // Tạo JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail());

        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    // Lấy thông tin user hiện tại
    public UserResponseDto getCurrentUser(User user) {
        return toResponseDto(user);
    }

    // Lấy danh sách tất cả user
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    // Lấy user theo ID
    public UserResponseDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toResponseDto(user);
    }

    // Cập nhật thông tin profile
    public UserResponseDto updateProfile(User currentUser, com.example.backend_java.dto.UserUpdateDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty()) {
            // Check username trùng lặp nếu đổi tên khác tên hiện tại
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

        user = userRepository.save(user);
        return toResponseDto(user);
    }

    // Chuyển đổi Entity → DTO
    private UserResponseDto toResponseDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .bio(user.getBio())
                .build();
    }
}
