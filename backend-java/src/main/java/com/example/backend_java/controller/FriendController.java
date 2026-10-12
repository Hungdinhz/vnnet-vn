package com.example.backend_java.controller;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.UserResponseDto;

import com.example.backend_java.dto.social.FriendRequestResponseDto;
import com.example.backend_java.dto.social.FriendshipResponseDto;
import com.example.backend_java.dto.social.FriendshipStatusResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.FriendService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    // POST /friends/request/{friend_id} - Gửi lời mời kết bạn
    @PostMapping("/request/{friendId}")
    public ResponseEntity<FriendshipResponseDto> sendRequest(
            @PathVariable Long friendId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.sendFriendRequest(currentUser.getId(), friendId));
    }

    // POST /friends/accept/{request_id} - Chấp nhận lời mời
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<FriendshipResponseDto> acceptRequest(
            @PathVariable Long requestId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.acceptFriendRequest(requestId, currentUser.getId()));
    }

    // GET /friends/list - Xem danh sách bạn bè
    @GetMapping("/list")
    public ResponseEntity<List<FriendshipResponseDto>> getFriends(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getFriendsList(currentUser.getId()));
    }

    // GET /friends/requests - Lời mời đang chờ
    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestResponseDto>> getPendingRequests(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getPendingRequests(currentUser.getId()));
    }

    // GET /friends/suggestions - Gợi ý kết bạn
    @GetMapping("/suggestions")
    public ResponseEntity<List<com.example.backend_java.dto.user.UserResponseDto>> getSuggestions(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getSuggestions(currentUser.getId()));
    }

    // DELETE /friends/{friendshipId} - Hủy kết bạn
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<com.example.backend_java.dto.common.MessageDto> unfriend(
            @PathVariable Long friendshipId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        friendService.unfriend(friendshipId, currentUser.getId());
        return ResponseEntity.ok(new com.example.backend_java.dto.common.MessageDto("Đã hủy kết bạn thành công"));
    }

    // GET /friends/status/{targetUserId} - Kiểm tra trạng thái quan hệ bạn bè
    @GetMapping("/status/{targetUserId}")
    public ResponseEntity<FriendshipStatusResponseDto> getFriendshipStatus(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getFriendshipStatus(currentUser.getId(), targetUserId));
    }

    // GET /friends/sent-requests - Danh sách lời mời đã gửi đang chờ
    @GetMapping("/sent-requests")
    public ResponseEntity<List<FriendRequestResponseDto>> getSentRequests(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getSentPendingRequests(currentUser.getId()));
    }

    // DELETE /friends/request/{requestId} - Hủy / Từ chối lời mời kết bạn
    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<com.example.backend_java.dto.common.MessageDto> rejectRequest(
            @PathVariable Long requestId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        friendService.rejectFriendRequest(requestId, currentUser.getId());
        return ResponseEntity.ok(new com.example.backend_java.dto.common.MessageDto("Đã hủy/từ chối lời mời kết bạn"));
    }

    // DELETE /friends/request/user/{targetUserId} - Hủy lời mời kết bạn với người dùng chỉ định
    @DeleteMapping("/request/user/{targetUserId}")
    public ResponseEntity<com.example.backend_java.dto.common.MessageDto> cancelRequestByUser(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        friendService.cancelFriendRequestByTargetUser(currentUser.getId(), targetUserId);
        return ResponseEntity.ok(new com.example.backend_java.dto.common.MessageDto("Đã hủy lời mời kết bạn"));
    }
}
