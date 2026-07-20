package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PostCreateDto {

    @NotBlank(message = "Title không được để trống")
    private String title;

    @NotBlank(message = "Content không được để trống")
    private String content;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("shared_post_id")
    private Long sharedPostId;

    @JsonProperty("group_id")
    private Long groupId;

    @JsonProperty("mentioned_user_ids")
    private List<Long> mentionedUserIds;
}

