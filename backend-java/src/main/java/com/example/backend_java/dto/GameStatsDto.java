package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStatsDto {

    @JsonProperty("total_games_played")
    private long totalGamesPlayed;

    @JsonProperty("total_plays")
    private long totalPlays;

    @JsonProperty("total_score")
    private long totalScore;

    @JsonProperty("achievements_unlocked")
    private long achievementsUnlocked;

    @JsonProperty("favorite_game")
    private GameResponseDto favoriteGame;

    @JsonProperty("recent_scores")
    private List<GameScoreResponseDto> recentScores;
}
