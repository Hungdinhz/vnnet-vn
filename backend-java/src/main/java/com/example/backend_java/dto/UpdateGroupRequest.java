package com.example.backend_java.dto;

import lombok.Data;

@Data
public class UpdateGroupRequest {
    private String name;
    private String description;
    private String coverUrl;
}
