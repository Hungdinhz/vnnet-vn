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
public class StoryResponseDto {

    private Long id;

    @JsonProperty("owner_id")
    private Long ownerId;

    private PostResponseDto.UserOutDto owner;

    private String content;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("background_color")
    private String backgroundColor;

    @JsonProperty("text_style")
    private String textStyle;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("expires_at")
    private LocalDateTime expiresAt;

    @JsonProperty("views_count")
    @Builder.Default
    private int viewsCount = 0;

    @JsonProperty("is_viewed")
    @Builder.Default
    private boolean isViewed = false;
}
