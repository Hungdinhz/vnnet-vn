package com.example.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptDto {
    private Long conversationId;
    private Long userId;
    private LocalDateTime readAt;
}
