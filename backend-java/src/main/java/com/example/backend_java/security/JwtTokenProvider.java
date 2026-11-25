package com.example.backend_java.security;

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

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET phải có độ dài tối thiểu 32 byte (256 bit) để đảm bảo an toàn HS256.");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // Tạo JWT token kèm tokenVersion để hỗ trợ thu hồi tức thì
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
