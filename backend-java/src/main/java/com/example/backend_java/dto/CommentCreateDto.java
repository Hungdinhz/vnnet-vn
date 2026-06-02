package com.example.backend_java.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentCreateDto {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;

    @com.fasterxml.jackson.annotation.JsonProperty("parent_id")
    private Long parentId;
}
