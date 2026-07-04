package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class UserUpdateDto {
    private String username;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    @JsonProperty("cover_url")
    private String coverUrl;

    @JsonProperty("full_name")
    private String fullName;

    private String location;
    private String workplace;
    private String website;
    private String phone;

    private String bio;
}
