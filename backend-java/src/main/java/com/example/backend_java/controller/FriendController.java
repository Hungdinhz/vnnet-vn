package com.example.backend_java.controller;

import com.example.backend_java.dto.FriendRequestResponseDto;
import com.example.backend_java.dto.FriendshipResponseDto;
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
    public ResponseEntity<List<com.example.backend_java.dto.UserResponseDto>> getSuggestions(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(friendService.getSuggestions(currentUser.getId()));
    }
}
