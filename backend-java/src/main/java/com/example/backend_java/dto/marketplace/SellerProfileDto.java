package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class SellerProfileDto {

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

    @JsonProperty("active_items_count")
    private Integer activeItemsCount;

    @JsonProperty("sold_items_count")
    private Integer soldItemsCount;

    private List<SellerReviewResponseDto> reviews;
}
