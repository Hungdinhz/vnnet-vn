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
public class GroupMemberDTO {
    private Long id;
    private Long groupId;
    private Long userId;
    private String username;
    private String avatarUrl;
    private String bio;
    private String role;
    private LocalDateTime joinedAt;
}
