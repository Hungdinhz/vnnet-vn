package com.example.backend_java.game.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameActionRequest {
    private String roomCode;
    private String type; // MOVE, RESIGN, REMATCH, OFFER_DRAW, ACCEPT_DRAW
    @Builder.Default
    private Map<String, Object> payload = new HashMap<>();
}
