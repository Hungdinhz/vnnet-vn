package com.example.backend_java.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogDto {
    private Long id;
    @JsonProperty("actor_id")
    private Long actorId;
    @JsonProperty("actor_email")
    private String actorEmail;
    @JsonProperty("actor_role")
    private String actorRole;
    private String action;
    @JsonProperty("target_type")
    private String targetType;
    @JsonProperty("target_id")
    private Long targetId;
    private String reason;
    @JsonProperty("metadata_json")
    private String metadataJson;
    @JsonProperty("ip_address")
    private String ipAddress;
    @JsonProperty("user_agent")
    private String userAgent;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
