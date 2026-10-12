package com.example.backend_java.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDirectConversationDto {
    @NotNull(message = "userId is required")
    private Long userId;
}
