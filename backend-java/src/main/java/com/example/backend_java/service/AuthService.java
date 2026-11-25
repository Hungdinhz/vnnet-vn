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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final String RECOVERY_KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

    private void validateUsernameForRegistration(String username) {
        if (username == null || username.length() < 3 || username.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập phải từ 3 đến 50 ký tự!");
        }
        if (username.matches("^\\d+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập không được chỉ gồm chữ số!");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng!");
        }
    }

    private String generateRecoveryKey() {
        StringBuilder sb = new StringBuilder("VNNET-");
        for (int i = 0; i < 12; i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append('-');
            }
            sb.append(RECOVERY_KEY_ALPHABET.charAt(secureRandom.nextInt(RECOVERY_KEY_ALPHABET.length())));
        }
        return sb.toString();
    }

    // Đăng ký user mới: Lưu tạm vào pending_registrations
    public UserResponseDto registerUser(UserCreateDto dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String username = dto.getUsername().trim();

        validateUsernameForRegistration(username);
        PasswordValidationUtil.validate(dto.getPassword());

        if (!EmailValidationUtil.hasMxRecord(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên miền email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email!");
        }

        User existingUserByEmail = userRepository.findByEmail(email).orElse(null);
        if (existingUserByEmail != null && Boolean.TRUE.equals(existingUserByEmail.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký và kích hoạt tài khoản!");
        }

        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNum);

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email).orElse(null);
        if (pending != null) {
            pending.setUsername(username);
            pending.setHashedPassword(hashedPassword);
            pending.setOtpCode(otp);
            pending.setAttemptCount(0);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
        } else {
            pending = PendingRegistration.builder()
                    .email(email)
                    .username(username)
                    .hashedPassword(hashedPassword)
                    .otpCode(otp)
                    .attemptCount(0)
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
                .orElse(null);

        if (user == null || user.getHashedPassword() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        if (!passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        // Tài khoản khách được phép đăng nhập dù isVerified=false; tài khoản thường bắt buộc isVerified=true
        if (!Boolean.TRUE.equals(user.getIsGuest()) && Boolean.FALSE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt. Vui lòng xác minh email trước khi đăng nhập!");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getTokenVersion());

        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    // Đăng xuất: Tăng tokenVersion để thu hồi ngay toàn bộ JWT cũ
    public MessageDto logout(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);
        return new MessageDto("Đăng xuất thành công");
    }

    // Quên mật khẩu (trả thông báo đồng nhất để chống dò email tồn tại)
    public MessageDto forgotPassword(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        if (user != null && Boolean.TRUE.equals(user.getIsVerified()) && !Boolean.TRUE.equals(user.getIsGuest())) {
            String otp = otpService.generateOtp(user.getEmail(), TokenType.PASSWORD_RESET, 10);
            emailService.sendPasswordResetEmail(user.getEmail(), otp);
        }

        return new MessageDto("Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến hộp thư của bạn");
    }

    // Đặt lại mật khẩu
    public MessageDto resetPassword(ResetPasswordDto dto) {
        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn"));

        PasswordValidationUtil.validate(dto.getNewPassword());

        otpService.validateOtp(normalizedEmail, dto.getOtp(), TokenType.PASSWORD_RESET);

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);

        return new MessageDto("Đặt lại mật khẩu thành công");
    }

    // Google Login
    public GoogleAuthResponseDto googleLogin(GoogleLoginDto dto) {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(dto.getIdToken());
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email Google chưa được xác minh!");
        }
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElse(null);

        // Chỉ cho đăng nhập tự động nếu là tài khoản THƯỜNG đã xác thực (tuyệt đối không gộp vào tài khoản khách)
        if (user != null && Boolean.TRUE.equals(user.getIsVerified()) && !Boolean.TRUE.equals(user.getIsGuest())) {
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

            String token = jwtTokenProvider.generateToken(user.getEmail(), user.getTokenVersion());
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
            if (baseUsername.isBlank() || baseUsername.matches("^\\d+$")) baseUsername = "user";
            String suggestedUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsernameIgnoreCase(suggestedUsername)) {
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
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email Google chưa được xác minh!");
        }
        String email = payload.getEmail().trim().toLowerCase();
        String googleId = payload.getSubject();
        String pictureUrl = (String) payload.get("picture");

        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null && Boolean.TRUE.equals(existingUser.getIsVerified()) && !Boolean.TRUE.equals(existingUser.getIsGuest())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký tài khoản!");
        }

        String username = dto.getUsername().trim();
        validateUsernameForRegistration(username);

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
            pending.setAttemptCount(0);
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
                    .attemptCount(0)
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

    // Verify OTP email (Đã vá CRIT-01: Tuyệt đối không cấp token nếu không có PendingRegistration hợp lệ)
    public TokenDto verifyEmail(VerifyOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        String otpCode = dto.getOtp().trim();

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(identifier)
                .or(() -> pendingRegistrationRepository.findByUsername(identifier))
                .orElse(null);

        if (pending == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu đăng ký không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại!");
        }

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn. Vui lòng thực hiện đăng ký lại!");
        }

        int attempts = pending.getAttemptCount() != null ? pending.getAttemptCount() : 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng đăng ký lại!");
        }

        boolean matched = MessageDigest.isEqual(
                pending.getOtpCode().getBytes(StandardCharsets.UTF_8),
                otpCode.getBytes(StandardCharsets.UTF_8)
        );
        if (!matched) {
            attempts++;
            if (attempts >= MAX_OTP_ATTEMPTS) {
                pendingRegistrationRepository.delete(pending);
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng đăng ký lại!");
            }
            pending.setAttemptCount(attempts);
            pendingRegistrationRepository.save(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác!");
        }

        User existingByEmail = userRepository.findByEmail(pending.getEmail()).orElse(null);
        if (existingByEmail != null) {
            if (Boolean.TRUE.equals(existingByEmail.getIsGuest()) && !Boolean.TRUE.equals(existingByEmail.getIsVerified())) {
                // Nếu một tài khoản khách chưa xác thực đang chiếm trước email này, đổi email của tài khoản khách đó sang định danh nội bộ
                existingByEmail.setEmail("guest_" + existingByEmail.getId() + "_" + System.currentTimeMillis() + "@guest.local");
                userRepository.save(existingByEmail);
            } else {
                pendingRegistrationRepository.delete(pending);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng bởi một tài khoản khác!");
            }
        }

        if (userRepository.existsByUsernameIgnoreCase(pending.getUsername())) {
            pendingRegistrationRepository.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập này đã được sử dụng bởi tài khoản khác!");
        }

        User user = User.builder()
                .email(pending.getEmail())
                .username(pending.getUsername())
                .hashedPassword(pending.getHashedPassword())
                .fullName(pending.getFullName())
                .avatarUrl(pending.getAvatarUrl())
                .googleId(pending.getGoogleId())
                .isVerified(true)
                .isGuest(false)
                .tokenVersion(0)
                .build();

        user = userRepository.save(user);
        pendingRegistrationRepository.delete(pending);

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getTokenVersion());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build();
    }

    // Gửi lại mã OTP
    public MessageDto resendOtp(ResendOtpDto dto) {
        String identifier = dto.getEmail().trim().toLowerCase();
        TokenType type;
        try {
            type = TokenType.valueOf(dto.getType());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại xác thực không hợp lệ");
        }

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
            pending.setAttemptCount(0);
            pending.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            pending.setCreatedAt(LocalDateTime.now());
            pendingRegistrationRepository.save(pending);

            emailService.sendVerificationEmail(pending.getEmail(), otp);
            return new MessageDto("Mã OTP đã được gửi lại thành công");
        } else if (type == TokenType.PASSWORD_RESET) {
            User user = userRepository.findByEmail(identifier).orElse(null);
            if (user != null && Boolean.TRUE.equals(user.getIsVerified()) && !Boolean.TRUE.equals(user.getIsGuest())) {
                String otp = otpService.generateOtp(user.getEmail(), type, 10);
                emailService.sendPasswordResetEmail(user.getEmail(), otp);
            }
            return new MessageDto("Nếu email tồn tại trong hệ thống, mã OTP đặt lại mật khẩu đã được gửi lại");
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại xác thực không hợp lệ");
    }

    // Đăng ký tài khoản khách (Không cần OTP, cấp Mã Khôi Phục Bí Mật 1 lần)
    public TokenDto registerGuest(GuestRegisterDto dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String username = dto.getUsername().trim();

        validateUsernameForRegistration(username);
        PasswordValidationUtil.validate(dto.getPassword());

        if (!EmailValidationUtil.isValidSyntax(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Địa chỉ email không đúng định dạng (Ví dụ: user@example.com)!");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng!");
        }

        String recoveryKey = generateRecoveryKey();

        User guestUser = User.builder()
                .username(username)
                .email(email)
                .fullName(username)
                .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                .recoveryKeyHash(passwordEncoder.encode(recoveryKey))
                .isVerified(false) // Không chiếm trạng thái xác thực của email thật
                .isGuest(true)
                .tokenVersion(0)
                .build();

        guestUser = userRepository.save(guestUser);

        String token = jwtTokenProvider.generateToken(guestUser.getEmail(), guestUser.getTokenVersion());
        return TokenDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .recoveryKey(recoveryKey)
                .build();
    }

    // Kiểm tra cú pháp email tài khoản khách cho bước quên mật khẩu (không tiết lộ tài khoản có tồn tại hay không)
    public MessageDto guestForgotPasswordCheck(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        if (!EmailValidationUtil.isValidSyntax(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Địa chỉ email không đúng định dạng (Ví dụ: user@example.com)!");
        }

        return new MessageDto("Vui lòng nhập Mã Khôi Phục bí mật và mật khẩu mới để tiếp tục");
    }

    // Đặt lại mật khẩu tài khoản khách (BẮT BUỘC có Mã Khôi Phục bí mật hợp lệ)
    public MessageDto guestResetPassword(GuestResetPasswordDto dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String rawRecoveryKey = dto.getRecoveryKey() != null ? dto.getRecoveryKey().trim().toUpperCase() : "";

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getIsGuest()) || user.getRecoveryKeyHash() == null
                || !passwordEncoder.matches(rawRecoveryKey, user.getRecoveryKeyHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email hoặc Mã Khôi Phục tài khoản khách không chính xác!");
        }

        PasswordValidationUtil.validate(dto.getNewPassword());

        user.setHashedPassword(passwordEncoder.encode(dto.getNewPassword()));
        int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);

        return new MessageDto("Đặt lại mật khẩu tài khoản khách thành công");
    }
}
