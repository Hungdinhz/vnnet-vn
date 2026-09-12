package com.example.backend_java.service;

import com.example.backend_java.entity.TokenType;
import com.example.backend_java.entity.VerificationToken;
import com.example.backend_java.repository.VerificationTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

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
            if (latest.getCreatedAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi gửi lại mã");
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
        Optional<VerificationToken> latestOpt = verificationTokenRepository
                .findTopByEmailAndTokenTypeAndIsUsedFalseOrderByCreatedAtDesc(email, type);

        if (latestOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không tồn tại hoặc đã được sử dụng");
        }

        VerificationToken token = latestOpt.get();

        if (!token.getOtpCode().equals(otpCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn");
        }

        // Đánh dấu đã sử dụng
        token.setIsUsed(true);
        verificationTokenRepository.save(token);

        return true;
    }
}
