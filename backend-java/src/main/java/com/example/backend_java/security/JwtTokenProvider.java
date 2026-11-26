package com.example.backend_java.security;

import com.example.backend_java.entity.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    public static final String SCOPE_USER = "USER";
    public static final String SCOPE_ADMIN_OTP_PENDING = "ADMIN_OTP_PENDING";
    public static final String SCOPE_ADMIN = "ADMIN";

    private static final long ADMIN_CHALLENGE_EXPIRATION_MS = 5 * 60 * 1000L; // 5 phút

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.admin-expiration:1800000}")
    private long jwtAdminExpiration = 1800000L;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET phải có độ dài tối thiểu 32 byte (256 bit) để đảm bảo an toàn HS256.");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // Tạo JWT token kèm tokenVersion cho phiên người dùng thông thường
    public String generateToken(String email) {
        return generateToken(email, 0);
    }

    public String generateToken(String email, Integer tokenVersion) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        int tv = tokenVersion != null ? tokenVersion : 0;

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("tv", tv)
                .claim("scope", SCOPE_USER)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // Tạo challenge token ngắn hạn (5 phút) giữa bước 1 và bước 2 của cổng đăng nhập Admin
    public String generateAdminChallengeToken(String email, Integer tokenVersion) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + ADMIN_CHALLENGE_EXPIRATION_MS);
        int tv = tokenVersion != null ? tokenVersion : 0;

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("tv", tv)
                .claim("scope", SCOPE_ADMIN_OTP_PENDING)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // Tạo Admin JWT tách biệt (scope=ADMIN + role + thời hạn ngắn)
    public String generateAdminToken(String email, Integer tokenVersion, Role role) {
        Date now = new Date();
        long exp = jwtAdminExpiration > 0 ? jwtAdminExpiration : 1800000L;
        Date expiryDate = new Date(now.getTime() + exp);
        int tv = tokenVersion != null ? tokenVersion : 0;

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("tv", tv)
                .claim("scope", SCOPE_ADMIN)
                .claim("role", role != null ? role.name() : Role.USER.name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // Lấy email từ token (giải mã "sub")
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Integer getTokenVersionFromToken(String token) {
        Object tv = parseClaims(token).get("tv");
        if (tv instanceof Number num) {
            return num.intValue();
        }
        return 0;
    }

    public String getScopeFromToken(String token) {
        Object scope = parseClaims(token).get("scope");
        return scope != null ? scope.toString() : SCOPE_USER;
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Kiểm tra token có hợp lệ không
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        if (this.signingKey == null) {
            init();
        }
        return this.signingKey;
    }
}
