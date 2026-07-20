package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class StoryCreateDto {

    private String content;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("background_color")
    private String backgroundColor;

    @JsonProperty("text_style")
    private String textStyle;
}
