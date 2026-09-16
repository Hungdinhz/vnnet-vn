package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameScoreResponseDto {

    private Long id;

    @JsonProperty("game_id")
    private Long gameId;

    @JsonProperty("game_title")
    private String gameTitle;

    private UserOutDto user;

    private Integer score;

    @JsonProperty("play_time_seconds")
    private Integer playTimeSeconds;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    private Integer rank;

    @JsonProperty("unlocked_achievements")
    private List<GameAchievementDto> unlockedAchievements;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserOutDto {
        private Long id;
        private String username;

        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
