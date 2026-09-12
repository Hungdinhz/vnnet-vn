package com.example.backend_java.service;

import com.example.backend_java.dto.GoogleAuthResponseDto;
import com.example.backend_java.dto.GoogleRegisterDto;
import com.example.backend_java.dto.TokenDto;
import com.example.backend_java.dto.UserCreateDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.PendingRegistration;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.PendingRegistrationRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend_java.util.EmailValidationUtil;
import com.example.backend_java.util.PasswordValidationUtil;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(UserRepository userRepository,
                       PendingRegistrationRepository pendingRegistrationRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       OtpService otpService,
                       EmailService emailService,
                       GoogleAuthService googleAuthService) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
        this.emailService = emailService;
        this.googleAuthService = googleAuthService;
    }

    // Đăng ký user mới: Lưu tạm vào pending_registrations, TUYỆT ĐỐI KHÔNG lưu vào bảng users
    public UserResponseDto registerUser(UserCreateDto dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String username = dto.getUsername().trim();

        // 0. Kiểm tra độ mạnh mật khẩu (tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt)
        PasswordValidationUtil.validate(dto.getPassword());

        // Kiểm tra tính hợp lệ của tên miền email (MX Record)
        if (!EmailValidationUtil.hasMxRecord(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên miền email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email!");
        }

        // 1. Kiểm tra email trùng lặp với tài khoản đã tồn tại trong database
        User existingUserByEmail = userRepository.findByEmail(email).orElse(null);
        if (existingUserByEmail != null && Boolean.TRUE.equals(existingUserByEmail.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký và kích hoạt tài khoản!");
        }

        // 2. Kiểm tra username trùng lặp trong bảng users
        User existingUserByUsername = userRepository.findByUsername(username).orElse(null);
        if (existingUserByUsername != null && Boolean.TRUE.equals(existingUserByUsername.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
        }

        // 3. Kiểm tra username trong pending_registrations (nếu người khác đang giữ tên này và chưa hết hạn)
        PendingRegistration pendingByUsername = pendingRegistrationRepository.findByUsername(username).orElse(null);
        if (pendingByUsername != null && !pendingByUsername.getEmail().equalsIgnoreCase(email)
                && pendingByUsername.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đang được một tài khoản khác đăng ký. Vui lòng chọn tên khác!");
        }

        // 4. Băm mật khẩu bằng BCrypt
        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        // 5. Sinh mã OTP 6 số
        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNum);

        // 6. Lưu tạm vào pending_registrations (TTL 10 phút) - TUYỆT ĐỐI KHÔNG insert vào users
        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email).orElse(null);
        if (pending != null) {
            pending.setUsername(username);
            pending.setHashedPassword(hashedPassword);
            pending.setOtpCode(otp);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
        } else {
            pending = PendingRegistration.builder()
                    .email(email)
                    .username(username)
                    .hashedPassword(hashedPassword)
                    .otpCode(otp)
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        pendingRegistrationRepository.save(pending);

        // 7. Gửi mã OTP qua email
        emailService.sendVerificationEmail(email, otp);

        return UserResponseDto.builder()
                .username(username)
                .email(email)
                .isVerified(false)
                .build();
    }

    // Đăng nhập (tương đương authenticate_user + login_for_access_token)
    public TokenDto login(String usernameOrEmail, String password) {
        String identifier = usernameOrEmail.trim();

        // Tìm user bằng email hoặc username
        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByUsername(identifier))
                .orElse(null);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        // Bắt buộc tài khoản phải được kích hoạt bằng mã xác thực email
        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt. Vui lòng xác minh email trước khi đăng nhập!");
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

        PasswordValidationUtil.validate(dto.getNewPassword());

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

        PasswordValidationUtil.validate(dto.getNewPassword());

        otpService.validateOtp(dto.getEmail(), dto.getOtp(), com.example.backend_java.entity.TokenType.PASSWORD_RESET);

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new com.example.backend_java.dto.MessageDto("Đặt lại mật khẩu thành công");
    }

    public GoogleAuthResponseDto googleLogin(com.example.backend_java.dto.GoogleLoginDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        String mode = dto.getMode() != null ? dto.getMode().trim().toLowerCase() : "login";

        User user = userRepository.findByEmail(email).orElse(null);

        if ("login".equals(mode)) {
            // Mode ĐĂNG NHẬP: chỉ cho phép nếu đã có tài khoản
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tài khoản chưa được đăng ký. Vui lòng đăng ký trước!");
            }
            // Cập nhật thông tin Google nếu chưa có
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
            if (user.getFullName() == null || user.getFullName().isBlank()) {
                user.setFullName(name);
            }
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
                user.setAvatarUrl(pictureUrl);
            }
            user.setIsVerified(true);
            user = userRepository.save(user);

            String token = jwtTokenProvider.generateToken(user.getEmail());
            return GoogleAuthResponseDto.builder()
                    .accessToken(token)
                    .tokenType("bearer")
                    .isNewUser(false)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .suggestedUsername(user.getUsername())
                    .build();
        } else {
            // Mode ĐĂNG KÝ
            if (user != null && Boolean.TRUE.equals(user.getIsVerified())) {
                // Đã có tài khoản kích hoạt → đăng nhập luôn
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user = userRepository.save(user);
                }
                String token = jwtTokenProvider.generateToken(user.getEmail());
                return GoogleAuthResponseDto.builder()
                        .accessToken(token)
                        .tokenType("bearer")
                        .isNewUser(false)
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .avatarUrl(user.getAvatarUrl())
                        .suggestedUsername(user.getUsername())
                        .build();
            } else {
                // Chưa có tài khoản → trả thông tin để frontend hiện form hoàn tất
                // KHÔNG tạo tài khoản, KHÔNG trả token
                String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
                if (baseUsername.isBlank()) baseUsername = "user";
                String suggestedUsername = baseUsername;
                int counter = 1;
                while (userRepository.existsByUsername(suggestedUsername)) {
                    suggestedUsername = baseUsername + counter;
                    counter++;
                }

                return GoogleAuthResponseDto.builder()
                        .accessToken(null) // Không có token vì chưa tạo tài khoản
                        .tokenType(null)
                        .isNewUser(true)
                        .email(email)
                        .fullName(name)
                        .avatarUrl(pictureUrl)
                        .suggestedUsername(suggestedUsername)
                        .build();
            }
        }
    }

    public UserResponseDto googleRegister(GoogleRegisterDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String pictureUrl = (String) payload.get("picture");

        // Kiểm tra xem email đã có tài khoản kích hoạt chưa
        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null && Boolean.TRUE.equals(existingUser.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký tài khoản!");
        }

        String username = dto.getUsername().trim();
        // Kiểm tra username đã được sử dụng bởi tài khoản kích hoạt chưa
        User existingUsername = userRepository.findByUsername(username).orElse(null);
        if (existingUsername != null && Boolean.TRUE.equals(existingUsername.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
        }

        String fullName = dto.getFullName() != null && !dto.getFullName().trim().isEmpty()
                ? dto.getFullName().trim()
                : (String) payload.get("name");

        // Kiểm tra độ mạnh mật khẩu
        PasswordValidationUtil.validate(dto.getPassword());

        // Sinh mã OTP 6 số
        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNum);

        // Lưu tạm vào pending_registrations - KHÔNG insert vào users
        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email).orElse(null);
        if (pending != null) {
            pending.setUsername(username);
            pending.setFullName(fullName);
            pending.setHashedPassword(passwordEncoder.encode(dto.getPassword()));
            pending.setAvatarUrl(pictureUrl);
            pending.setGoogleId(googleId);
            pending.setOtpCode(otp);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
        } else {
            pending = PendingRegistration.builder()
                    .email(email)
                    .username(username)
                    .fullName(fullName)
                    .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                    .avatarUrl(pictureUrl)
                    .googleId(googleId)
                    .otpCode(otp)
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        pendingRegistrationRepository.save(pending);

        // Gửi OTP xác thực email
        emailService.sendVerificationEmail(email, otp);

        return UserResponseDto.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
                .avatarUrl(pictureUrl)
                .isVerified(false)
                .build();
    }

    public TokenDto verifyEmail(com.example.backend_java.dto.VerifyOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        String otpCode = dto.getOtp().trim();

        // 1. Tìm thông tin trong bảng pending_registrations
        PendingRegistration pending = pendingRegistrationRepository.findByEmail(identifier)
                .or(() -> pendingRegistrationRepository.findByUsername(identifier))
                .orElse(null);

        if (pending == null) {
            // Kiểm tra xem tài khoản đã được kích hoạt trước đó chưa
            User alreadyUser = userRepository.findByEmail(identifier)
                    .or(() -> userRepository.findByUsername(identifier))
                    .orElse(null);
            if (alreadyUser != null && Boolean.TRUE.equals(alreadyUser.getIsVerified())) {
                String token = jwtTokenProvider.generateToken(alreadyUser.getEmail());
                return TokenDto.builder()
                        .accessToken(token)
                        .tokenType("bearer")
                        .build();
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu đăng ký không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại!");
        }

        // 2. Kiểm tra thời hạn OTP (TTL 10 phút)
        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn. Vui lòng thực hiện đăng ký lại!");
        }

        // 3. Kiểm tra mã OTP khớp
        if (!pending.getOtpCode().equals(otpCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác!");
        }

        // 4. CHỈ KHI OTP HỢP LỆ: Chính thức INSERT vào bảng users với is_verified = true
        if (userRepository.existsByEmail(pending.getEmail())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng bởi một tài khoản khác!");
        }
        if (userRepository.existsByUsername(pending.getUsername())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng bởi một tài khoản khác!");
        }

        User user = User.builder()
                .email(pending.getEmail())
                .username(pending.getUsername())
                .hashedPassword(pending.getHashedPassword())
                .fullName(pending.getFullName())
                .avatarUrl(pending.getAvatarUrl())
                .googleId(pending.getGoogleId())
                .isVerified(true)
                .build();

        user = userRepository.save(user);

        // 5. Xóa dữ liệu đăng ký tạm thời
        pendingRegistrationRepository.delete(pending);

        // 6. Tạo và trả về JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    public com.example.backend_java.dto.MessageDto resendOtp(com.example.backend_java.dto.ResendOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        com.example.backend_java.entity.TokenType type = com.example.backend_java.entity.TokenType.valueOf(dto.getType());

        if (type == com.example.backend_java.entity.TokenType.REGISTER_VERIFICATION) {
            PendingRegistration pending = pendingRegistrationRepository.findByEmail(identifier)
                    .or(() -> pendingRegistrationRepository.findByUsername(identifier))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy thông tin đăng ký chờ xác thực. Vui lòng đăng ký lại!"));

            // Kiểm tra cooldown 60 giây
            if (pending.getCreatedAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi gửi lại mã");
            }

            int otpNum = 100000 + secureRandom.nextInt(900000);
            String otp = String.valueOf(otpNum);
            pending.setOtpCode(otp);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
            pendingRegistrationRepository.save(pending);

            emailService.sendVerificationEmail(pending.getEmail(), otp);
            return new com.example.backend_java.dto.MessageDto("Mã OTP đã được gửi lại thành công");
        } else if (type == com.example.backend_java.entity.TokenType.PASSWORD_RESET) {
            User user = userRepository.findByEmail(identifier)
                    .or(() -> userRepository.findByUsername(identifier))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));

            String otp = otpService.generateOtp(user.getEmail(), type, 10);
            emailService.sendPasswordResetEmail(user.getEmail(), otp);
            return new com.example.backend_java.dto.MessageDto("Mã OTP đặt lại mật khẩu đã được gửi lại thành công");
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại xác thực không hợp lệ");
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
