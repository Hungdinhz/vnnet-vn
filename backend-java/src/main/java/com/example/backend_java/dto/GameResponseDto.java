package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameResponseDto {

    private Long id;
    private String title;
    private String description;
    private String category;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("thumbnail_url")
    private String thumbnailUrl;

    @JsonProperty("max_score")
    private Integer maxScore;

    private String difficulty;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("play_count")
    private Long playCount;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("current_user_high_score")
    private Integer currentUserHighScore;

    @JsonProperty("current_user_plays")
    private Long currentUserPlays;

    @JsonProperty("achievements_count")
    private Integer achievementsCount;
}
