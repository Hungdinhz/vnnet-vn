package com.example.backend_java.dto.social;

import lombok.Data;

@Data
public class UpdateSocialGroupDto {
    private String name;
    private String description;
    private String coverUrl;
}
