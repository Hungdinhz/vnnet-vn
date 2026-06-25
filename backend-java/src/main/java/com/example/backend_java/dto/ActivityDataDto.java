package com.example.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDataDto {
    private String date;     // yyyy-MM-dd
    private Long posts;
    private Long comments;
    private Long likes;
}
