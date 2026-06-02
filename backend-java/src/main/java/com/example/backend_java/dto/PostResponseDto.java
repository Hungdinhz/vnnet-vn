package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class PostResponseDto {

    private Long id;
    private String title;
    private String content;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("owner_id")
    private Long ownerId;

    private UserOutDto owner;

    @JsonProperty("likes_count")
    @Builder.Default
    private int likesCount = 0;

    @JsonProperty("comments_count")
    @Builder.Default
    private int commentsCount = 0;

    @JsonProperty("is_liked")
    @Builder.Default
    private boolean isLiked = false;

    @Data
    @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class UserOutDto {
        private Long id;
        private String username;

        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
