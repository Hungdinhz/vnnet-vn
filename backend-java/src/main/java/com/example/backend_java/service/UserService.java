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
    private final OtpService otpService;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider,
                       OtpService otpService, EmailService emailService, GoogleAuthService googleAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
        this.emailService = emailService;
        this.googleAuthService = googleAuthService;
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
                .isVerified(false)
                .build();

        user = userRepository.save(user);
        
        String otp = otpService.generateOtp(user.getEmail(), com.example.backend_java.entity.TokenType.REGISTER_VERIFICATION, 10);
        emailService.sendVerificationEmail(user.getEmail(), otp);
        
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

        if (!user.getIsVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt. Vui lòng xác minh email của bạn.");
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
        return toResponseDto(user);
    }

    // Đổi mật khẩu
    public com.example.backend_java.dto.MessageDto changePassword(User currentUser, com.example.backend_java.dto.ChangePasswordDto dto) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác!");
        }

        if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new com.example.backend_java.dto.MessageDto("Đổi mật khẩu thành công!");
    }

    // Quên mật khẩu
    public com.example.backend_java.dto.MessageDto forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));
        
        String otp = otpService.generateOtp(user.getEmail(), com.example.backend_java.entity.TokenType.PASSWORD_RESET, 10);
        emailService.sendPasswordResetEmail(user.getEmail(), otp);

        return new com.example.backend_java.dto.MessageDto("Mã OTP đã được gửi đến email của bạn");
    }

    // Đặt lại mật khẩu
    public com.example.backend_java.dto.MessageDto resetPassword(com.example.backend_java.dto.ResetPasswordDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));

        otpService.validateOtp(dto.getEmail(), dto.getOtp(), com.example.backend_java.entity.TokenType.PASSWORD_RESET);

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new com.example.backend_java.dto.MessageDto("Đặt lại mật khẩu thành công");
    }

    public TokenDto googleLogin(com.example.backend_java.dto.GoogleLoginDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                userRepository.save(user);
            }
        } else {
            String username = email.split("@")[0] + "_" + new java.util.Random().nextInt(10000);
            while (userRepository.existsByUsername(username)) {
                username = email.split("@")[0] + "_" + new java.util.Random().nextInt(10000);
            }
            user = User.builder()
                    .username(username)
                    .email(email)
                    .fullName(name)
                    .avatarUrl(pictureUrl)
                    .googleId(googleId)
                    .isVerified(true)
                    .hashedPassword(null)
                    .build();
            userRepository.save(user);
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    public TokenDto verifyEmail(com.example.backend_java.dto.VerifyOtpDto dto) {
        otpService.validateOtp(dto.getEmail(), dto.getOtp(), com.example.backend_java.entity.TokenType.REGISTER_VERIFICATION);
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));
        
        user.setIsVerified(true);
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    public com.example.backend_java.dto.MessageDto resendOtp(com.example.backend_java.dto.ResendOtpDto dto) {
        com.example.backend_java.entity.TokenType type = com.example.backend_java.entity.TokenType.valueOf(dto.getType());
        String otp = otpService.generateOtp(dto.getEmail(), type, 10);
        
        if (type == com.example.backend_java.entity.TokenType.REGISTER_VERIFICATION) {
            emailService.sendVerificationEmail(dto.getEmail(), otp);
        } else if (type == com.example.backend_java.entity.TokenType.PASSWORD_RESET) {
            emailService.sendPasswordResetEmail(dto.getEmail(), otp);
        }
        
        return new com.example.backend_java.dto.MessageDto("Mã OTP đã được gửi lại thành công");
    }

    // Chuyển đổi Entity → DTO
    private UserResponseDto toResponseDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .fullName(user.getFullName())
                .location(user.getLocation())
                .workplace(user.getWorkplace())
                .website(user.getWebsite())
                .phone(user.getPhone())
                .bio(user.getBio())
                .isVerified(user.getIsVerified())
                .build();
    }
}
