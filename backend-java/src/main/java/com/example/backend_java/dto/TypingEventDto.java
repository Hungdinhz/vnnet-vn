package com.example.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEventDto {
    private Long conversationId;
    private Long userId;
    private String username;
    private Boolean isTyping;
}
