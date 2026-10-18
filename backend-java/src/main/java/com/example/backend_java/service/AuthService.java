package com.example.backend_java.service;

import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.entity.PendingRegistration;
import com.example.backend_java.entity.TokenType;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.PendingRegistrationRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.util.EmailValidationUtil;
import com.example.backend_java.util.PasswordValidationUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository,
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

    // Đăng ký user mới: Lưu tạm vào pending_registrations
    public UserResponseDto registerUser(UserCreateDto dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String username = dto.getUsername().trim();

        PasswordValidationUtil.validate(dto.getPassword());

        if (!EmailValidationUtil.hasMxRecord(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên miền email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email!");
        }

        User existingUserByEmail = userRepository.findByEmail(email).orElse(null);
        if (existingUserByEmail != null && Boolean.TRUE.equals(existingUserByEmail.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký và kích hoạt tài khoản!");
        }

        User existingUserByUsername = userRepository.findByUsername(username).orElse(null);
        if (existingUserByUsername != null && Boolean.TRUE.equals(existingUserByUsername.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
        }

        PendingRegistration pendingByUsername = pendingRegistrationRepository.findByUsername(username).orElse(null);
        if (pendingByUsername != null && !pendingByUsername.getEmail().equalsIgnoreCase(email)
                && pendingByUsername.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đang được một tài khoản khác đăng ký. Vui lòng chọn tên khác!");
        }

        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNum);

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

        emailService.sendVerificationEmail(email, otp);

        return UserResponseDto.builder()
                .username(username)
                .email(email)
                .isVerified(false)
                .build();
    }

    // Đăng nhập
    public TokenDto login(String usernameOrEmail, String password) {
        String identifier = usernameOrEmail.trim();

        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByUsername(identifier))
                .orElse(null);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        if (!passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt. Vui lòng xác minh email trước khi đăng nhập!");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());

        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    // Quên mật khẩu
    public MessageDto forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));

        String otp = otpService.generateOtp(user.getEmail(), TokenType.PASSWORD_RESET, 10);
        emailService.sendPasswordResetEmail(user.getEmail(), otp);

        return new MessageDto("Mã OTP đã được gửi đến email của bạn");
    }

    // Đặt lại mật khẩu
    public MessageDto resetPassword(ResetPasswordDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));

        PasswordValidationUtil.validate(dto.getNewPassword());

        otpService.validateOtp(dto.getEmail(), dto.getOtp(), TokenType.PASSWORD_RESET);

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new MessageDto("Đặt lại mật khẩu thành công");
    }

    // Google Login
    public GoogleAuthResponseDto googleLogin(GoogleLoginDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        String mode = dto.getMode() != null ? dto.getMode().trim().toLowerCase() : "login";

        User user = userRepository.findByEmail(email).orElse(null);

        // Nếu user đã tồn tại và đã xác thực -> Đăng nhập luôn
        if (user != null && Boolean.TRUE.equals(user.getIsVerified())) {
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
            if (user.getFullName() == null || user.getFullName().isBlank()) {
                user.setFullName(name);
            }
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
                user.setAvatarUrl(pictureUrl);
            }
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
            // User chưa có tài khoản hoặc chưa xác thực -> Chuyển sang hoàn tất đăng ký
            String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            if (baseUsername.isBlank()) baseUsername = "user";
            String suggestedUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(suggestedUsername)) {
                suggestedUsername = baseUsername + counter;
                counter++;
            }

            return GoogleAuthResponseDto.builder()
                    .accessToken(null)
                    .tokenType(null)
                    .isNewUser(true)
                    .email(email)
                    .fullName(name)
                    .avatarUrl(pictureUrl)
                    .suggestedUsername(suggestedUsername)
                    .build();
        }
    }

    // Google Register
    public UserResponseDto googleRegister(GoogleRegisterDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String pictureUrl = (String) payload.get("picture");

        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null && Boolean.TRUE.equals(existingUser.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký tài khoản!");
        }

        String username = dto.getUsername().trim();
        User existingUsername = userRepository.findByUsername(username).orElse(null);
        if (existingUsername != null && Boolean.TRUE.equals(existingUsername.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
        }

        String fullName = dto.getFullName() != null && !dto.getFullName().trim().isEmpty()
                ? dto.getFullName().trim()
                : (String) payload.get("name");

        PasswordValidationUtil.validate(dto.getPassword());

        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNum);

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

        emailService.sendVerificationEmail(email, otp);

        return UserResponseDto.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
                .avatarUrl(pictureUrl)
                .isVerified(false)
                .build();
    }

    // Verify OTP email
    public TokenDto verifyEmail(VerifyOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        String otpCode = dto.getOtp().trim();

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(identifier)
                .or(() -> pendingRegistrationRepository.findByUsername(identifier))
                .orElse(null);

        if (pending == null) {
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

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn. Vui lòng thực hiện đăng ký lại!");
        }

        if (!pending.getOtpCode().equals(otpCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác!");
        }

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
        pendingRegistrationRepository.delete(pending);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    // Gửi lại mã OTP
    public MessageDto resendOtp(ResendOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        TokenType type = TokenType.valueOf(dto.getType());

        if (type == TokenType.REGISTER_VERIFICATION) {
            PendingRegistration pending = pendingRegistrationRepository.findByEmail(identifier)
                    .or(() -> pendingRegistrationRepository.findByUsername(identifier))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy thông tin đăng ký chờ xác thực. Vui lòng đăng ký lại!"));

            if (pending.getCreatedAt() != null) {
                long secondsDiff = java.time.Duration.between(pending.getCreatedAt(), LocalDateTime.now()).getSeconds();
                if (secondsDiff >= 0 && secondsDiff < 60) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi gửi lại mã");
                }
            }

            int otpNum = 100000 + secureRandom.nextInt(900000);
            String otp = String.valueOf(otpNum);
            pending.setOtpCode(otp);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
            pendingRegistrationRepository.save(pending);

            emailService.sendVerificationEmail(pending.getEmail(), otp);
            return new MessageDto("Mã OTP đã được gửi lại thành công");
        } else if (type == TokenType.PASSWORD_RESET) {
            User user = userRepository.findByEmail(identifier)
                    .or(() -> userRepository.findByUsername(identifier))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với email này"));

            String otp = otpService.generateOtp(user.getEmail(), type, 10);
            emailService.sendPasswordResetEmail(user.getEmail(), otp);
            return new MessageDto("Mã OTP đặt lại mật khẩu đã được gửi lại thành công");
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại xác thực không hợp lệ");
    }
}
