package com.example.backend_java.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AddMembersDto {
    @NotEmpty(message = "Danh sách thành viên không được để trống")
    private List<Long> memberIds;
}
