package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PostUpdateDto {

    private String title;

    private String content;

    @JsonProperty("image_url")
    private String imageUrl;
}
