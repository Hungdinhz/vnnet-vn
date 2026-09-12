package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations", indexes = {
    @Index(name = "idx_pending_email", columnList = "email"),
    @Index(name = "idx_pending_username", columnList = "username")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, unique = true, nullable = false)
    private String email;

    @Column(length = 50, nullable = false)
    private String username;

    @Column(name = "hashed_password", length = 255, nullable = false)
    private String hashedPassword;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "google_id", length = 100)
    private String googleId;

    @Column(name = "otp_code", length = 6, nullable = false)
    private String otpCode;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
