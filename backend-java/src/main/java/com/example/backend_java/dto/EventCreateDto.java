package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventCreateDto {
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
}
