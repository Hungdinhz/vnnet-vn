package com.example.backend_java.dto.social;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSocialGroupDto {
    private String name;
    private String description;

    @JsonProperty("cover_url")
    @JsonAlias({"coverUrl", "cover_url"})
    private String coverUrl;

    @JsonProperty("requires_approval")
    @JsonAlias({"requiresApproval", "requires_approval"})
    private Boolean requiresApproval;

    @JsonProperty("is_private")
    @JsonAlias({"isPrivate", "is_private"})
    private Boolean isPrivate;
}
