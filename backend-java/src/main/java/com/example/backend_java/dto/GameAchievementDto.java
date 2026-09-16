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
public class GameAchievementDto {

    private Long id;

    @JsonProperty("game_id")
    private Long gameId;

    private String title;

    private String description;

    private String icon;

    @JsonProperty("required_score")
    private Integer requiredScore;

    @JsonProperty("required_plays")
    private Integer requiredPlays;

    @JsonProperty("unlocked_by_current_user")
    @Builder.Default
    private boolean unlockedByCurrentUser = false;

    @JsonProperty("unlocked_at")
    private LocalDateTime unlockedAt;
}
