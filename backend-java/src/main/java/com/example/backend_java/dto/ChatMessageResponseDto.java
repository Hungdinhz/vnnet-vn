package com.example.backend_java.dto;

import com.example.backend_java.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private Long receiverId;
    private String content;
    private MessageType messageType;
    private String imageUrl;
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderUsername;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private Boolean isRead;
}
