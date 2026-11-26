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
public class RoomCreateRequest {
    private String gameSlug;
    private String roomName;
    @Builder.Default
    private Boolean isPrivate = false;
    @Builder.Default
    private Boolean vsBot = false;
    @Builder.Default
    private Integer turnTimeSeconds = 30;
    @Builder.Default
    private Map<String, Object> rules = new HashMap<>();
}
