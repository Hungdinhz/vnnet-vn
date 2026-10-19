package com.example.backend_java.controller;

import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.BlockStatusDto;
import com.example.backend_java.dto.user.BlockedUserDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.UserBlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserBlockController {

    private final UserBlockService userBlockService;

    public UserBlockController(UserBlockService userBlockService) {
        this.userBlockService = userBlockService;
    }

    // POST /users/{targetUserId}/block - Chặn người dùng
    @PostMapping("/{targetUserId}/block")
    public ResponseEntity<MessageDto> blockUser(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userBlockService.blockUser(targetUserId, currentUser));
    }

    // DELETE /users/{targetUserId}/block - Gỡ chặn người dùng
    @DeleteMapping("/{targetUserId}/block")
    public ResponseEntity<MessageDto> unblockUser(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userBlockService.unblockUser(targetUserId, currentUser));
    }

    // GET /users/blocked - Danh sách những người dùng mà tôi đã chặn
    @GetMapping("/blocked")
    public ResponseEntity<List<BlockedUserDto>> getBlockedUsers(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userBlockService.getBlockedUsers(currentUser));
    }

    // GET /users/{targetUserId}/block-status - Kiểm tra trạng thái chặn giữa 2 người dùng
    @GetMapping("/{targetUserId}/block-status")
    public ResponseEntity<BlockStatusDto> getBlockStatus(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            currentUserId = ((User) authentication.getPrincipal()).getId();
        }
        return ResponseEntity.ok(userBlockService.getBlockStatus(targetUserId, currentUserId));
    }
}
