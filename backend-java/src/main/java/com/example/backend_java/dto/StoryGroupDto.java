package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class StoryGroupDto {

    @JsonProperty("user_id")
    private Long userId;

    private String username;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    @JsonProperty("has_unviewed")
    @Builder.Default
    private boolean hasUnviewed = false;

    private List<StoryResponseDto> stories;
}
