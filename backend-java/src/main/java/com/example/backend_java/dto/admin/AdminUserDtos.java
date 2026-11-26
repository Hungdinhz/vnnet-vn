package com.example.backend_java.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AdminUserDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserSummaryDto {
        private Long id;
        private String username;
        private String email;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("avatar_url")
        private String avatarUrl;
        private String role;
        @JsonProperty("account_status")
        private String accountStatus;
        @JsonProperty("banned_until")
        private LocalDateTime bannedUntil;
        @JsonProperty("ban_reason")
        private String banReason;
        @JsonProperty("is_verified")
        private Boolean isVerified;
        @JsonProperty("is_guest")
        private Boolean isGuest;
        @JsonProperty("is_private")
        private Boolean isPrivate;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        @JsonProperty("last_login_at")
        private LocalDateTime lastLoginAt;
        @JsonProperty("posts_count")
        private Long postsCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserStatusRequest {
        @NotBlank(message = "Trạng thái không được để trống (ACTIVE, SUSPENDED, BANNED)")
        private String status;

        @JsonProperty("duration_hours")
        private Integer durationHours;

        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRoleRequest {
        @NotBlank(message = "Vai trò không được để trống (USER, MODERATOR, ADMIN, SUPER_ADMIN)")
        private String role;

        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserVerifyRequest {
        @NotNull(message = "Thiếu trạng thái xác minh")
        @JsonProperty("is_verified")
        private Boolean isVerified;

        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReasonRequest {
        private String reason;
    }
}
