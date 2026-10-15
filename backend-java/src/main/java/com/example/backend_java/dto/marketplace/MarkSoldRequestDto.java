package com.example.backend_java.dto.marketplace;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MarkSoldRequestDto {

    @JsonProperty("buyer_id")
    private Long buyerId;

    @JsonProperty("buyer_username")
    private String buyerUsername;
}
