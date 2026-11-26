package com.example.backend_java.game.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomPlayerDto {
    private Long userId; // null if bot
    private String username;
    private String avatarUrl;
    private int seatIndex;
    private String symbol; // "X" or "O" for Caro
    private boolean ready;
    private boolean host;
    private boolean bot;
    private boolean connected;
    private int elo;
    private Integer eloDelta;
    private boolean wantsRematch;
}
