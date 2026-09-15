package com.example.backend_java.dto;

import com.example.backend_java.entity.MessageType;
import lombok.Data;

@Data
public class ChatMessageRequestDto {
    private Long conversationId;
    private Long receiverId;
    private String content;
    private MessageType messageType = MessageType.TEXT;
    private String imageUrl;
    private Long replyToId;
}
