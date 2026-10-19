package com.example.backend_java.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String username;
    private String email;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    @JsonProperty("cover_url")
    private String coverUrl;

    @JsonProperty("full_name")
    private String fullName;

    private String location;
    private String workplace;
    private String website;
    private String phone;

    private String bio;

    @JsonProperty("is_verified")
    private Boolean isVerified;

    @JsonProperty("is_guest")
    private Boolean isGuest;

    @JsonProperty("is_private")
    @com.fasterxml.jackson.annotation.JsonAlias({"isPrivate", "is_private"})
    private Boolean isPrivate;

    @JsonProperty("isPrivate")
    public Boolean getIsPrivateCamel() {
        return this.isPrivate;
    }

    @JsonProperty("is_blocked_by_me")
    private Boolean isBlockedByMe;

    @JsonProperty("is_blocked_by_them")
    private Boolean isBlockedByThem;
}
