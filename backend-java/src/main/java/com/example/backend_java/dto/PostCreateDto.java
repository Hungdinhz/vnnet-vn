package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostCreateDto {

    @NotBlank(message = "Title không được để trống")
    private String title;

    @NotBlank(message = "Content không được để trống")
    private String content;

    @JsonProperty("image_url")
    private String imageUrl;
}
