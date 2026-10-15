package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MarketplaceItemCreateDto {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotNull(message = "Giá không được để trống")
    @Min(value = 0, message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotBlank(message = "Danh mục không được để trống")
    private String category;

    @JsonProperty("condition")
    private String condition; // "new", "like_new", "used", "fair"

    private String location;

    @JsonProperty("image_urls")
    @Size(max = 5, message = "Tối đa 5 ảnh")
    private List<String> imageUrls;
}
