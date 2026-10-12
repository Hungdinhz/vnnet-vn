package com.example.backend_java.dto.social;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class FriendRequestResponseDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("friend_id")
    private Long friendId;

    private String status;

    @JsonProperty("sender_username")
    private String senderUsername;

    @JsonProperty("sender_avatar_url")
    private String senderAvatarUrl;

    @JsonProperty("receiver_username")
    private String receiverUsername;

    @JsonProperty("receiver_avatar_url")
    private String receiverAvatarUrl;

    @JsonProperty("receiver_email")
    private String receiverEmail;
}
