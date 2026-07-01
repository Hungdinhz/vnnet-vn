package com.example.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {
    private String name;
    private String description;
    // Cover URL could be handled separately via Cloudinary, but we allow an initial one
    private String coverUrl; 
}
