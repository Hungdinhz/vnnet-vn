package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class FriendshipResponseDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("friend_id")
    private Long friendId;

    private String status;

    @JsonProperty("friend_username")
    private String friendUsername;

    @JsonProperty("friend_avatar_url")
    private String friendAvatarUrl;
}
