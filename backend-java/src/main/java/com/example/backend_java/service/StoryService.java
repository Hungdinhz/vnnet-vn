package com.example.backend_java.service;

import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.StoryCreateDto;
import com.example.backend_java.dto.StoryGroupDto;
import com.example.backend_java.dto.StoryResponseDto;
import com.example.backend_java.entity.Story;
import com.example.backend_java.entity.StoryView;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.StoryRepository;
import com.example.backend_java.repository.StoryViewRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StoryService {

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserRepository userRepository;

    public StoryService(StoryRepository storyRepository, StoryViewRepository storyViewRepository,
                        UserRepository userRepository) {
        this.storyRepository = storyRepository;
        this.storyViewRepository = storyViewRepository;
        this.userRepository = userRepository;
    }

    // Tạo story mới (hết hạn sau 24h)
    public StoryResponseDto createStory(StoryCreateDto dto, User currentUser) {
        if ((dto.getContent() == null || dto.getContent().isBlank()) && 
            (dto.getImageUrl() == null || dto.getImageUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Story cần có nội dung hoặc ảnh");
        }

        Story story = Story.builder()
                .owner(currentUser)
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .backgroundColor(dto.getBackgroundColor() != null ? dto.getBackgroundColor() : "from-purple-600 to-pink-500")
                .textStyle(dto.getTextStyle() != null ? dto.getTextStyle() : "normal")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        story = storyRepository.save(story);
        return toResponseDto(story, currentUser.getId());
    }

    // Lấy tất cả stories đang active, nhóm theo user
    @Transactional(readOnly = true)
    public List<StoryGroupDto> getActiveStories(Long currentUserId) {
        List<Story> stories = storyRepository.findActiveStories(LocalDateTime.now());

        // Nhóm theo owner
        Map<Long, List<Story>> groupedByOwner = new LinkedHashMap<>();
        for (Story story : stories) {
            groupedByOwner.computeIfAbsent(story.getOwnerId(), k -> new ArrayList<>()).add(story);
        }

        // Đặt stories của current user lên đầu
        List<StoryGroupDto> result = new ArrayList<>();

        // Current user's stories first
        if (groupedByOwner.containsKey(currentUserId)) {
            result.add(buildStoryGroup(currentUserId, groupedByOwner.get(currentUserId), currentUserId));
            groupedByOwner.remove(currentUserId);
        }

        // Then others
        for (Map.Entry<Long, List<Story>> entry : groupedByOwner.entrySet()) {
            result.add(buildStoryGroup(entry.getKey(), entry.getValue(), currentUserId));
        }

        return result;
    }

    private StoryGroupDto buildStoryGroup(Long ownerId, List<Story> stories, Long currentUserId) {
        User owner = userRepository.findById(ownerId).orElse(null);
        
        List<StoryResponseDto> storyDtos = stories.stream()
                .map(s -> toResponseDto(s, currentUserId))
                .collect(Collectors.toList());

        boolean hasUnviewed = storyDtos.stream().anyMatch(s -> !s.isViewed());

        return StoryGroupDto.builder()
                .userId(ownerId)
                .username(owner != null ? owner.getUsername() : "Unknown")
                .avatarUrl(owner != null ? owner.getAvatarUrl() : null)
                .hasUnviewed(hasUnviewed)
                .stories(storyDtos)
                .build();
    }

    // Đánh dấu đã xem story
    @Transactional
    public void markAsViewed(Long storyId, Long viewerId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story không tồn tại"));

        // Không ghi lượt xem cho chủ story
        if (story.getOwnerId().equals(viewerId)) return;

        if (!storyViewRepository.existsByStoryIdAndViewerId(storyId, viewerId)) {
            StoryView view = StoryView.builder()
                    .story(story)
                    .viewerId(viewerId)
                    .build();
            storyViewRepository.save(view);
        }
    }

    // Lấy danh sách người xem (chỉ chủ story)
    @Transactional(readOnly = true)
    public List<PostResponseDto.UserOutDto> getViewers(Long storyId, Long currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story không tồn tại"));

        if (!story.getOwnerId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ story mới xem được danh sách người xem");
        }

        return storyViewRepository.findByStoryIdOrderByViewedAtDesc(storyId).stream()
                .map(view -> {
                    User viewer = userRepository.findById(view.getViewerId()).orElse(null);
                    return PostResponseDto.UserOutDto.builder()
                            .id(view.getViewerId())
                            .username(viewer != null ? viewer.getUsername() : "Unknown")
                            .avatarUrl(viewer != null ? viewer.getAvatarUrl() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // Xóa story (chỉ chủ story)
    @Transactional
    public void deleteStory(Long storyId, Long currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story không tồn tại"));

        if (!story.getOwnerId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa story này");
        }

        storyRepository.delete(story);
    }

    private StoryResponseDto toResponseDto(Story story, Long currentUserId) {
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
                .owner(PostResponseDto.UserOutDto.builder()
                        .id(owner.getId())
                        .username(owner.getUsername())
                        .avatarUrl(owner.getAvatarUrl())
                        .build())
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
