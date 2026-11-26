package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false)
    private String username;

    @Column(length = 100, unique = true, nullable = false)
    private String email;

    @Column(name = "hashed_password", length = 255, nullable = true)
    private String hashedPassword;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "cover_url")
    private String coverUrl;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "location")
    private String location;

    @Column(name = "workplace")
    private String workplace;

    @Column(name = "website")
    private String website;

    @Column(name = "phone")
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "reset_password_otp", length = 10)
    private String resetPasswordOtp;

    @Column(name = "google_id", length = 100, unique = true)
    private String googleId;

    @ColumnDefault("false")
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @ColumnDefault("false")
    @Column(name = "is_guest", nullable = false)
    @Builder.Default
    private Boolean isGuest = false;

    @ColumnDefault("false")
    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private Boolean isPrivate = false;

    @ColumnDefault("0")
    @Column(name = "token_version")
    @Builder.Default
    private Integer tokenVersion = 0;

    @Column(name = "recovery_key_hash", length = 255)
    private String recoveryKeyHash;

    @Enumerated(EnumType.STRING)
    @ColumnDefault("'USER'")
    @Column(name = "role", length = 20, nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @ColumnDefault("'ACTIVE'")
    @Column(name = "account_status", length = 20, nullable = false)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "banned_until")
    private LocalDateTime bannedUntil;

    @Column(name = "ban_reason", columnDefinition = "TEXT")
    private String banReason;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    public Role getEffectiveRole() {
        return this.role != null ? this.role : Role.USER;
    }

    public AccountStatus getEffectiveAccountStatus() {
        return this.accountStatus != null ? this.accountStatus : AccountStatus.ACTIVE;
    }

    public boolean isCurrentlyRestricted() {
        AccountStatus status = getEffectiveAccountStatus();
        if (status == AccountStatus.BANNED) {
            return true;
        }
        if (status == AccountStatus.SUSPENDED) {
            return this.bannedUntil == null || this.bannedUntil.isAfter(LocalDateTime.now());
        }
        return false;
    }
}
