package com.example.backend_java.dto;

import com.example.backend_java.entity.ConversationType;
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
public class ConversationResponseDto {
    private Long id;
    private ConversationType type;
    private String name;
    private String avatarUrl;
    private Long creatorId;
    private List<ConversationMemberDto> members;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private String lastMessageSenderName;
    private Long unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
