package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class PagedResponseDto<T> {

    private List<T> content;

    private int page;

    private int size;

    @JsonProperty("total_elements")
    private long totalElements;

    @JsonProperty("total_pages")
    private int totalPages;

    @JsonProperty("has_next")
    private boolean hasNext;
}
