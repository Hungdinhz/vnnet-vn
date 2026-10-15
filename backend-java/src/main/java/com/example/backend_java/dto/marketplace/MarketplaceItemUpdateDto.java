package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MarketplaceItemUpdateDto {

    private String title;
    private String description;
    private BigDecimal price;
    private String category;

    @JsonProperty("condition")
    private String condition;

    private String location;

    @JsonProperty("image_urls")
    private List<String> imageUrls;

    private String status; // "active", "sold", "hidden"
}
