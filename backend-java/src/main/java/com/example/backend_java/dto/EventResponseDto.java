package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponseDto {
    private Long id;
    private String title;
    private String description;
    
    @JsonProperty("location_name")
    private String locationName;
    
    private Double latitude;
    private Double longitude;
    
    @JsonProperty("event_date")
    private LocalDateTime eventDate;
    
    @JsonProperty("organizer_type")
    private String organizerType; // "USER" or "GROUP"
    
    @JsonProperty("organizer_id")
    private Long organizerId;
    
    @JsonProperty("organizer_name")
    private String organizerName;
    
    @JsonProperty("organizer_avatar_url")
    private String organizerAvatarUrl;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
