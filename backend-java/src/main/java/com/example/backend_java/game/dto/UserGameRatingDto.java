package com.example.backend_java.game.dto;

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
public class UserGameRatingDto {
    private int rank;
    private Long userId;
    private String username;
    private String avatarUrl;
    private int elo;
    private int wins;
    private int losses;
    private int draws;
    private int winStreak;
    private int bestWinStreak;
    private double winRate;
}
