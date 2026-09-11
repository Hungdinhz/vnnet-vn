package com.example.backend_java.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResendOtpDto {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String type; // "REGISTER_VERIFICATION" or "PASSWORD_RESET"
}
