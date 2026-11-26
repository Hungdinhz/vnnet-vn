package com.example.backend_java.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AdminAuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginStep1Request {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginStep1Response {
        @JsonProperty("challenge_token")
        private String challengeToken;

        @JsonProperty("masked_email")
        private String maskedEmail;

        @JsonProperty("expires_in_seconds")
        private int expiresInSeconds;

        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginStep2Request {
        @NotBlank(message = "Thiếu challenge_token")
        @JsonProperty("challenge_token")
        private String challengeToken;

        @NotBlank(message = "Mã OTP không được để trống")
        private String otp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminProfileDto {
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
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminTokenResponse {
        @JsonProperty("access_token")
        private String accessToken;

        @JsonProperty("token_type")
        private String tokenType;

        @JsonProperty("expires_in_seconds")
        private long expiresInSeconds;

        private AdminProfileDto admin;
    }
}
