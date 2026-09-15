package com.example.backend_java.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class CommentCreateDto {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;

    @com.fasterxml.jackson.annotation.JsonProperty("parent_id")
    private Long parentId;

    @com.fasterxml.jackson.annotation.JsonProperty("mentioned_user_ids")
    private List<Long> mentionedUserIds;
}
