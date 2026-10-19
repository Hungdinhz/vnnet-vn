package com.example.backend_java.dto.social;

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

    @JsonProperty("friend_user_id")
    private Long friendUserId;

    private String status;

    @JsonProperty("friend_username")
    private String friendUsername;

    @JsonProperty("friend_avatar_url")
    private String friendAvatarUrl;
}
