package com.example.backend_java.dto.social;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class FriendshipStatusResponseDto {

    // "none" | "pending_sent" | "pending_received" | "accepted" | "self"
    private String status;

    @JsonProperty("friendship_id")
    private Long friendshipId;

    @JsonProperty("request_id")
    private Long requestId;
}
