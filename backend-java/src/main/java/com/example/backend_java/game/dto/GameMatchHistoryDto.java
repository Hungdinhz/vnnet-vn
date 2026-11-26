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
public class GameMatchHistoryDto {
    private Long id;
    private String roomCode;
    private String mode;
    private String endReason;
    private int durationSeconds;
    private int totalMoves;
    private Long winnerId;
    private LocalDateTime createdAt;
    private List<PlayerOutcome> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerOutcome {
        private Long userId;
        private String displayName;
        private boolean bot;
        private int seatIndex;
        private int eloBefore;
        private int eloAfter;
        private String result;
    }
}
