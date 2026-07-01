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
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private String coverUrl;
    private Long creatorId;
    private LocalDateTime createdAt;
    
    // Additional fields for frontend
    private int memberCount;
    private int postCount; // (optional)
    private boolean isJoined;
    private String userRole; // "ADMIN" or "MEMBER"
}
