package com.example.backend_java.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdminModerationDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateReportRequest {
        @NotBlank(message = "Thiếu loại đối tượng báo cáo (POST, COMMENT, USER, GROUP, MARKETPLACE_ITEM)")
        @JsonProperty("target_type")
        private String targetType;

        @NotNull(message = "Thiếu ID đối tượng báo cáo")
        @JsonProperty("target_id")
        private Long targetId;

        @NotBlank(message = "Thiếu lý do báo cáo")
        @JsonProperty("reason_category")
        private String reasonCategory;

        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportItemDto {
        private Long id;
        @JsonProperty("reporter_id")
        private Long reporterId;
        @JsonProperty("reporter_username")
        private String reporterUsername;
        @JsonProperty("target_type")
        private String targetType;
        @JsonProperty("target_id")
        private Long targetId;
        @JsonProperty("target_preview")
        private String targetPreview;
        @JsonProperty("reason_category")
        private String reasonCategory;
        private String description;
        private String status;
        @JsonProperty("handled_by")
        private Long handledBy;
        @JsonProperty("resolution_note")
        private String resolutionNote;
        @JsonProperty("action_taken")
        private String actionTaken;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        @JsonProperty("resolved_at")
        private LocalDateTime resolvedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveReportRequest {
        @NotBlank(message = "Thiếu hành động xử lý (DISMISS, HIDE_CONTENT, DELETE_CONTENT, WARN_USER, SUSPEND_USER, BAN_USER)")
        private String action;

        @JsonProperty("resolution_note")
        private String resolutionNote;

        @JsonProperty("suspend_hours")
        private Integer suspendHours;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HideContentRequest {
        @NotBlank(message = "Vui lòng nhập lý do ẩn nội dung")
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminPostDto {
        private Long id;
        private String title;
        private String content;
        @JsonProperty("image_url")
        private String imageUrl;
        private String visibility;
        @JsonProperty("owner_id")
        private Long ownerId;
        @JsonProperty("owner_username")
        private String ownerUsername;
        @JsonProperty("group_id")
        private Long groupId;
        @JsonProperty("is_hidden")
        private Boolean isHidden;
        @JsonProperty("hidden_reason")
        private String hiddenReason;
        @JsonProperty("hidden_at")
        private LocalDateTime hiddenAt;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminGroupDto {
        private Long id;
        private String name;
        private String description;
        @JsonProperty("creator_id")
        private Long creatorId;
        @JsonProperty("is_private")
        private Boolean isPrivate;
        @JsonProperty("is_hidden")
        private Boolean isHidden;
        @JsonProperty("hidden_reason")
        private String hiddenReason;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminMarketplaceDto {
        private Long id;
        private String title;
        private String description;
        private BigDecimal price;
        private String category;
        private String status;
        @JsonProperty("seller_id")
        private Long sellerId;
        @JsonProperty("is_hidden")
        private Boolean isHidden;
        @JsonProperty("hidden_reason")
        private String hiddenReason;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardOverviewDto {
        @JsonProperty("total_users")
        private long totalUsers;
        @JsonProperty("active_users_24h")
        private long activeUsers24h;
        @JsonProperty("new_users_24h")
        private long newUsers24h;
        @JsonProperty("new_users_7d")
        private long newUsers7d;
        @JsonProperty("restricted_users")
        private long restrictedUsers;
        @JsonProperty("total_posts")
        private long totalPosts;
        @JsonProperty("new_posts_24h")
        private long newPosts24h;
        @JsonProperty("total_groups")
        private long totalGroups;
        @JsonProperty("active_marketplace_items")
        private long activeMarketplaceItems;
        @JsonProperty("pending_reports")
        private long pendingReports;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyGrowthPoint {
        private String date;
        @JsonProperty("active_users")
        private long activeUsers;
        @JsonProperty("new_users")
        private long newUsers;
        @JsonProperty("new_posts")
        private long newPosts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardGrowthDto {
        private int days;
        private List<DailyGrowthPoint> points;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BroadcastAnnouncementRequest {
        @NotBlank(message = "Nội dung thông báo không được để trống")
        private String message;

        @JsonProperty("target_user_id")
        private Long targetUserId; // null = broadcast toàn bộ user ACTIVE
    }
}
