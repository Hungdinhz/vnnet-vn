package com.example.backend_java.service.admin;

import com.example.backend_java.dto.admin.AdminAuthDtos.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.TokenType;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.service.EmailService;
import com.example.backend_java.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final AdminAuditService auditService;

    @Value("${jwt.admin-expiration:1800000}")
    private long jwtAdminExpiration = 1800000L;

    /**
     * Bước 1 đăng nhập Admin: Kiểm tra email + mật khẩu + role staff + ACTIVE, sau đó gửi OTP 6 số qua email.
     * Trả lỗi generic 401 để không tiết lộ tài khoản có phải admin hay không.
     */
    public LoginStep1Response loginStep1(LoginStep1Request request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null
                || user.getHashedPassword() == null
                || !passwordEncoder.matches(request.getPassword(), user.getHashedPassword())
                || !user.getEffectiveRole().isStaff()
                || !Boolean.TRUE.equals(user.getIsVerified())
                || user.isCurrentlyRestricted()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không hợp lệ");
        }

        String otp = otpService.generateOtp(email, TokenType.ADMIN_LOGIN_OTP, 5);
        emailService.sendAdminLoginOtpEmail(email, otp);

        String challengeToken = jwtTokenProvider.generateAdminChallengeToken(email, user.getTokenVersion());

        return LoginStep1Response.builder()
                .challengeToken(challengeToken)
                .maskedEmail(maskEmail(email))
                .expiresInSeconds(300)
                .message("Mã xác thực OTP 6 số đã được gửi tới email quản trị của bạn.")
                .build();
    }

    /**
     * Bước 2 đăng nhập Admin: Xác thực challenge_token (scope=ADMIN_OTP_PENDING) + mã OTP 6 số -> cấp Admin JWT.
     */
    public AdminTokenResponse loginStep2(LoginStep2Request request) {
        String challengeToken = request.getChallengeToken();
        if (!jwtTokenProvider.validateToken(challengeToken)
                || !JwtTokenProvider.SCOPE_ADMIN_OTP_PENDING.equals(jwtTokenProvider.getScopeFromToken(challengeToken))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.");
        }

        String email = jwtTokenProvider.getEmailFromToken(challengeToken);
        Integer tokenVersion = jwtTokenProvider.getTokenVersionFromToken(challengeToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên xác thực không hợp lệ."));

        int currentTv = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        if (!user.getEffectiveRole().isStaff() || user.isCurrentlyRestricted()
                || tokenVersion == null || tokenVersion != currentTv) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên xác thực không hợp lệ.");
        }

        otpService.validateOtp(email, request.getOtp(), TokenType.ADMIN_LOGIN_OTP);

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String adminToken = jwtTokenProvider.generateAdminToken(email, user.getTokenVersion(), user.getEffectiveRole());
        auditService.record(user, "ADMIN_LOGIN_SUCCESS", "ADMIN_SESSION", user.getId(),
                "Đăng nhập cổng quản trị 2FA thành công", Map.of("role", user.getEffectiveRole().name()));

        return AdminTokenResponse.builder()
                .accessToken(adminToken)
                .tokenType("bearer")
                .expiresInSeconds(jwtAdminExpiration / 1000L)
                .admin(toProfile(user))
                .build();
    }

    public AdminProfileDto getProfile(User currentAdmin) {
        return toProfile(currentAdmin);
    }

    public MessageDto logout(User currentAdmin) {
        User user = userRepository.findById(currentAdmin.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        int tv = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(tv + 1);
        userRepository.save(user);
        auditService.record(user, "ADMIN_LOGOUT", "ADMIN_SESSION", user.getId(), "Đăng xuất phiên quản trị", null);
        return new MessageDto("Đã đăng xuất và thu hồi toàn bộ phiên quản trị.");
    }

    private AdminProfileDto toProfile(User user) {
        return AdminProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getEffectiveRole().name())
                .accountStatus(user.getEffectiveAccountStatus().name())
                .build();
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 2) return "***" + email.substring(Math.max(0, at));
        return email.substring(0, 2) + "***" + email.substring(at);
    }
}
