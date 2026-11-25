package com.example.backend_java.mapper;

import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // Mặc định ẩn thông tin riêng tư (email, phone, isGuest) khi trả về cho người khác
    public UserResponseDto toResponseDto(User user) {
        return toPublicResponseDto(user);
    }

    public UserResponseDto toPublicResponseDto(User user) {
        if (user == null) {
            return null;
        }
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .fullName(user.getFullName())
                .location(user.getLocation())
                .workplace(user.getWorkplace())
                .website(user.getWebsite())
                .bio(user.getBio())
                .isPrivate(user.getIsPrivate() != null && user.getIsPrivate())
                .build();
    }

    // Chỉ dùng cho chính chủ tài khoản (GET /users/me, PUT /users/me)
    public UserResponseDto toSelfResponseDto(User user) {
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
                .isGuest(user.getIsGuest())
                .isPrivate(user.getIsPrivate() != null && user.getIsPrivate())
                .build();
    }
}
