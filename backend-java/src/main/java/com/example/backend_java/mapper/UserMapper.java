package com.example.backend_java.mapper;

import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponseDto toResponseDto(User user) {
        if (user == null) {
            return null;
        }
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .fullName(user.getFullName())
                .location(user.getLocation())
                .workplace(user.getWorkplace())
                .website(user.getWebsite())
                .phone(user.getPhone())
                .bio(user.getBio())
                .isVerified(user.getIsVerified())
                .build();
    }
}
