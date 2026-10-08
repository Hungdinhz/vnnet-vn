package com.example.backend_java.mapper;

import com.example.backend_java.dto.post.PostResponseDto;
import com.example.backend_java.dto.story.StoryResponseDto;
import com.example.backend_java.entity.Story;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.StoryViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StoryMapper {

    private final StoryViewRepository storyViewRepository;

    public StoryResponseDto toResponseDto(Story story, Long currentUserId) {
        int viewsCount = (int) storyViewRepository.countByStoryId(story.getId());
        boolean isViewed = currentUserId != null && storyViewRepository.existsByStoryIdAndViewerId(story.getId(), currentUserId);

        // Chủ story luôn coi là "đã xem"
        if (currentUserId != null && story.getOwnerId().equals(currentUserId)) {
            isViewed = true;
        }

        User owner = story.getOwner();

        return StoryResponseDto.builder()
                .id(story.getId())
                .ownerId(story.getOwnerId())
                .owner(owner != null ? PostResponseDto.UserOutDto.builder()
                        .id(owner.getId())
                        .username(owner.getUsername())
                        .avatarUrl(owner.getAvatarUrl())
                        .build() : null)
                .content(story.getContent())
                .imageUrl(story.getImageUrl())
                .backgroundColor(story.getBackgroundColor())
                .textStyle(story.getTextStyle())
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .viewsCount(viewsCount)
                .isViewed(isViewed)
                .build();
    }
}
