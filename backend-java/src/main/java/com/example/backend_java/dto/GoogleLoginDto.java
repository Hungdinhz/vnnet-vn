package com.example.backend_java.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginDto {
    @NotBlank
    private String idToken;
    
    // "login" hoặc "register" - mặc định là "login"
    private String mode;
}
