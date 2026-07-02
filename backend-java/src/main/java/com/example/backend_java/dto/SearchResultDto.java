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
public class SearchResultDto {

    private List<UserResponseDto> users;

    private List<PostResponseDto> posts;

    @JsonProperty("total_users")
    private long totalUsers;

    @JsonProperty("total_posts")
    private long totalPosts;
}
