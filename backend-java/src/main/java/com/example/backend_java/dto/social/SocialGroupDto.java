package com.example.backend_java.dto.social;

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
public class SocialGroupDto {
    private Long id;
    private String name;
    private String description;

    @JsonProperty("cover_url")
    private String coverUrl;

    @JsonProperty("creator_id")
    private Long creatorId;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    // Additional fields for frontend
    @JsonProperty("member_count")
    private int memberCount;

    @JsonProperty("post_count")
    private int postCount;

    @JsonProperty("is_joined")
    private boolean isJoined;

    @JsonProperty("user_role")
    private String userRole;

    @JsonProperty("requires_approval")
    @com.fasterxml.jackson.annotation.JsonAlias({"requiresApproval", "requires_approval"})
    private Boolean requiresApproval;

    @JsonProperty("is_private")
    @com.fasterxml.jackson.annotation.JsonAlias({"isPrivate", "is_private"})
    private Boolean isPrivate;

    @JsonProperty("join_request_status")
    private String joinRequestStatus;

    @JsonProperty("pending_request_count")
    private Integer pendingRequestCount;

    // Compatibility getters for both camelCase and standard boolean
    @JsonProperty("isJoined")
    public boolean getIsJoinedCamel() {
        return this.isJoined;
    }

    @JsonProperty("joined")
    public boolean getJoinedStandard() {
        return this.isJoined;
    }

    @JsonProperty("coverUrl")
    public String getCoverUrlCamel() {
        return this.coverUrl;
    }

    @JsonProperty("creatorId")
    public Long getCreatorIdCamel() {
        return this.creatorId;
    }

    @JsonProperty("createdAt")
    public LocalDateTime getCreatedAtCamel() {
        return this.createdAt;
    }

    @JsonProperty("memberCount")
    public int getMemberCountCamel() {
        return this.memberCount;
    }

    @JsonProperty("postCount")
    public int getPostCountCamel() {
        return this.postCount;
    }

    @JsonProperty("userRole")
    public String getUserRoleCamel() {
        return this.userRole;
    }

    @JsonProperty("requiresApproval")
    public Boolean getRequiresApprovalCamel() {
        return this.requiresApproval;
    }

    @JsonProperty("joinRequestStatus")
    public String getJoinRequestStatusCamel() {
        return this.joinRequestStatus;
    }

    @JsonProperty("pendingRequestCount")
    public Integer getPendingRequestCountCamel() {
        return this.pendingRequestCount;
    }

    @JsonProperty("isPrivate")
    public Boolean getIsPrivateCamel() {
        return this.isPrivate;
    }
}
