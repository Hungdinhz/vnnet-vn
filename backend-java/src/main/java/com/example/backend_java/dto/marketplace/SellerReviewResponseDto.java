package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class SellerReviewResponseDto {

    private Long id;

    @JsonProperty("seller_id")
    private Long sellerId;

    @JsonProperty("reviewer_id")
    private Long reviewerId;

    private ReviewerDto reviewer;

    @JsonProperty("item_id")
    private Long itemId;

    @JsonProperty("item_title")
    private String itemTitle;

    private Integer rating;
    private String comment;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class ReviewerDto {
        private Long id;
        private String username;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
