package com.example.backend_java.game.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomChatMessageDto {
    private String id;
    private String roomCode;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type; // CHAT, EMOJI, SYSTEM
    private long timestamp;
}
