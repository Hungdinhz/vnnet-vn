package com.example.backend_java.service;

import com.example.backend_java.entity.TokenType;
import com.example.backend_java.entity.VerificationToken;
import com.example.backend_java.repository.VerificationTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

    private static final int MAX_OTP_ATTEMPTS = 5;

    private final VerificationTokenRepository verificationTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(VerificationTokenRepository verificationTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    public String generateOtp(String email, TokenType type, int expireMinutes) {
        // Kiểm tra cooldown
        Optional<VerificationToken> latestOpt = verificationTokenRepository
                .findTopByEmailAndTokenTypeAndIsUsedFalseOrderByCreatedAtDesc(email, type);

        if (latestOpt.isPresent()) {
            VerificationToken latest = latestOpt.get();
            if (latest.getCreatedAt() != null) {
                long secondsDiff = java.time.Duration.between(latest.getCreatedAt(), LocalDateTime.now()).getSeconds();
                // Chỉ chặn nếu mã được tạo trong khoảng 0 đến 59 giây vừa qua
                if (secondsDiff >= 0 && secondsDiff < 60) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi gửi lại mã");
                }
            }
        }

        // Hủy các mã OTP cũ chưa sử dụng
        List<VerificationToken> oldTokens = verificationTokenRepository.findAllByEmailAndTokenTypeAndIsUsedFalse(email, type);
        for (VerificationToken token : oldTokens) {
            token.setIsUsed(true);
        }
        verificationTokenRepository.saveAll(oldTokens);

        // Tạo mã OTP 6 số
        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpNum);

        VerificationToken newToken = VerificationToken.builder()
                .email(email)
                .otpCode(otpCode)
                .tokenType(type)
                .expiresAt(LocalDateTime.now().plusMinutes(expireMinutes))
                .isUsed(false)
                .createdAt(LocalDateTime.now())
                .build();

        verificationTokenRepository.save(newToken);

        return otpCode;
    }

    public boolean validateOtp(String email, String otpCode, TokenType type) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        String normalizedOtp = otpCode != null ? otpCode.trim() : "";

        Optional<VerificationToken> latestOpt = verificationTokenRepository
                .findTopByEmailAndTokenTypeAndIsUsedFalseOrderByCreatedAtDesc(normalizedEmail, type);

        if (latestOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không tồn tại hoặc đã được sử dụng");
        }

        VerificationToken token = latestOpt.get();

        // Kiểm tra hết hạn TRƯỚC khi so sánh mã OTP
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setIsUsed(true);
            verificationTokenRepository.save(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn");
        }

        int attempts = token.getAttemptCount() != null ? token.getAttemptCount() : 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            token.setIsUsed(true);
            verificationTokenRepository.save(token);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Mã OTP đã bị vô hiệu hóa do nhập sai quá số lần cho phép. Vui lòng yêu cầu mã mới.");
        }

        boolean matched = MessageDigest.isEqual(
                token.getOtpCode().getBytes(StandardCharsets.UTF_8),
                normalizedOtp.getBytes(StandardCharsets.UTF_8)
        );

        if (!matched) {
            attempts++;
            token.setAttemptCount(attempts);
            if (attempts >= MAX_OTP_ATTEMPTS) {
                token.setIsUsed(true);
            }
            verificationTokenRepository.save(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    attempts >= MAX_OTP_ATTEMPTS
                            ? "Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu gửi lại mã mới."
                            : "Mã OTP không chính xác");
        }

        // Đánh dấu đã sử dụng
        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        return true;
    }
}
