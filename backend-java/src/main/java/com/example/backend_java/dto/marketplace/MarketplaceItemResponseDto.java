package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class MarketplaceItemResponseDto {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String category;

    @JsonProperty("condition")
    private String condition;

    private String location;

    @JsonProperty("image_urls")
    private List<String> imageUrls;

    private String status;

    @JsonProperty("seller_id")
    private Long sellerId;

    private SellerDto seller;

    @JsonProperty("buyer_id")
    private Long buyerId;

    private BuyerDto buyer;

    @JsonProperty("views_count")
    private Integer viewsCount;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class SellerDto {
        private Long id;
        private String username;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("avatar_url")
        private String avatarUrl;
        private String location;
        @JsonProperty("rating_avg")
        private Double ratingAvg;
        @JsonProperty("rating_count")
        private Long ratingCount;
    }

    @Data
    @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class BuyerDto {
        private Long id;
        private String username;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
