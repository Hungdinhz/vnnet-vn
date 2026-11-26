package com.example.backend_java.game.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomStateDto {
    private String roomCode;
    private String roomName;
    private String gameSlug;
    private Long gameId;
    private String status; // WAITING, PLAYING, FINISHED
    private boolean isPrivate;
    private boolean vsBot;
    private int maxPlayers;
    private int turnTimeSeconds;
    private Long turnDeadlineEpochMs;
    private Long reconnectDeadlineEpochMs;
    private Long disconnectedUserId;
    private Long hostUserId;
    @Builder.Default
    private Map<String, Object> rules = new HashMap<>();
    @Builder.Default
    private List<RoomPlayerDto> players = new ArrayList<>();
    private Map<String, Object> gameState;
    private Long winnerUserId; // null if bot or draw
    private Integer winnerSeat;
    private String endReason;
    private String systemMessage;
    @Builder.Default
    private List<RoomChatMessageDto> recentChat = new ArrayList<>();
}
