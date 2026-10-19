package com.example.backend_java.dto.social;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GroupJoinRequestDto {
    private Long id;

    @JsonProperty("group_id")
    private Long groupId;

    @JsonProperty("user_id")
    private Long userId;

    private String username;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String bio;
    private String status;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Compatibility getters
    @JsonProperty("groupId")
    public Long getGroupIdCamel() {
        return this.groupId;
    }

    @JsonProperty("userId")
    public Long getUserIdCamel() {
        return this.userId;
    }

    @JsonProperty("avatarUrl")
    public String getAvatarUrlCamel() {
        return this.avatarUrl;
    }

    @JsonProperty("createdAt")
    public LocalDateTime getCreatedAtCamel() {
        return this.createdAt;
    }
}
