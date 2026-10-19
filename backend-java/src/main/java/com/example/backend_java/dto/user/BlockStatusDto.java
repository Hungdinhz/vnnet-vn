package com.example.backend_java.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockStatusDto {
    @JsonProperty("is_blocked_by_me")
    private boolean isBlockedByMe;

    @JsonProperty("is_blocked_by_them")
    private boolean isBlockedByThem;

    @JsonProperty("is_blocked")
    private boolean isBlocked;
}
