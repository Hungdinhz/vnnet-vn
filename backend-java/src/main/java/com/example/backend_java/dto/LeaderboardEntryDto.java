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
public class LeaderboardEntryDto {

    private int rank;

    private UserOutDto user;

    @JsonProperty("high_score")
    private Integer highScore;

    @JsonProperty("total_plays")
    private Long totalPlays;

    @JsonProperty("last_played_at")
    private LocalDateTime lastPlayedAt;

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
