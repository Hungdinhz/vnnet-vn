package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CommentResponseDto {

    private Long id;
    private String content;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("post_id")
    private Long postId;

    private UserOutDto owner;

    @Data
    @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class UserOutDto {
        private Long id;
        private String username;
        
        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
