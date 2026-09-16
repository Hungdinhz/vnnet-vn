package com.example.backend_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GameScoreCreateDto {

    @NotNull(message = "Điểm số không được để trống")
    @Min(value = 0, message = "Điểm số không được âm")
    private Integer score;

    @NotNull(message = "Thời gian chơi không được để trống")
    @Min(value = 1, message = "Thời gian chơi tối thiểu 1 giây")
    @JsonProperty("play_time_seconds")
    private Integer playTimeSeconds;
}
