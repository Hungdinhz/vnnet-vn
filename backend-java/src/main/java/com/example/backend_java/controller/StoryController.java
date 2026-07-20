package com.example.backend_java.controller;

import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.StoryCreateDto;
import com.example.backend_java.dto.StoryGroupDto;
import com.example.backend_java.dto.StoryResponseDto;
import com.example.backend_java.dto.MessageDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.StoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    // POST /stories - Tạo story mới (cần token)
    @PostMapping("")
    public ResponseEntity<StoryResponseDto> createStory(
            @RequestBody StoryCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(storyService.createStory(dto, currentUser));
    }

    // GET /stories - Lấy tất cả stories đang active (cần token)
    @GetMapping("")
    public ResponseEntity<List<StoryGroupDto>> getActiveStories(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(storyService.getActiveStories(currentUser.getId()));
    }

    // POST /stories/{id}/view - Đánh dấu đã xem (cần token)
    @PostMapping("/{storyId}/view")
    public ResponseEntity<MessageDto> markAsViewed(
            @PathVariable Long storyId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        storyService.markAsViewed(storyId, currentUser.getId());
        return ResponseEntity.ok(new MessageDto("Đã xem story"));
    }

    // GET /stories/{id}/viewers - Danh sách người xem (chỉ chủ story)
    @GetMapping("/{storyId}/viewers")
    public ResponseEntity<List<PostResponseDto.UserOutDto>> getViewers(
            @PathVariable Long storyId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(storyService.getViewers(storyId, currentUser.getId()));
    }

    // DELETE /stories/{id} - Xóa story (chỉ chủ story)
    @DeleteMapping("/{storyId}")
    public ResponseEntity<MessageDto> deleteStory(
            @PathVariable Long storyId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        storyService.deleteStory(storyId, currentUser.getId());
        return ResponseEntity.ok(new MessageDto("Đã xóa story"));
    }
}
