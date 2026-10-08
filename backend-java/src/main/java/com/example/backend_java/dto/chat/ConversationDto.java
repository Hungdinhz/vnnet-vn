package com.example.backend_java.dto.chat;
import com.example.backend_java.dto.user.UserResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private UserResponseDto contact;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
}
