package com.example.backend_java.service;

import com.example.backend_java.dto.FriendRequestResponseDto;
import com.example.backend_java.dto.FriendshipResponseDto;
import com.example.backend_java.entity.Friendship;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.FriendshipRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public FriendService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    // Gửi lời mời kết bạn - tương đương crud_friend.send_friend_request
    public FriendshipResponseDto sendFriendRequest(Long userId, Long friendId) {
        // Không thể kết bạn với chính mình
        if (userId.equals(friendId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể kết bạn với chính mình");
        }

        // Kiểm tra đã có lời mời hoặc đã là bạn
        friendshipRepository.findExistingFriendship(userId, friendId).ifPresent(f -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lời mời đã tồn tại hoặc hai người đã là bạn");
        });

        Friendship friendship = Friendship.builder()
                .userId(userId)
                .friendId(friendId)
                .status("pending")
                .build();

        friendship = friendshipRepository.save(friendship);
        return toResponseDto(friendship);
    }

    // Chấp nhận lời mời - tương đương crud_friend.accept_friend_request
    public FriendshipResponseDto acceptFriendRequest(Long requestId, Long currentUserId) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lời mời kết bạn"));

        // Chỉ người nhận mới có quyền chấp nhận
        if (!friendship.getFriendId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền chấp nhận lời mời này");
        }

        friendship.setStatus("accepted");
        friendship = friendshipRepository.save(friendship);
        return toResponseDto(friendship);
    }

    // Lấy danh sách bạn bè - tương đương crud_friend.get_friends_list
    public List<FriendshipResponseDto> getFriendsList(Long userId) {
        return friendshipRepository.findAcceptedFriendships(userId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    // Lấy lời mời đang chờ - tương đương crud_friend.get_pending_requests
    public List<FriendRequestResponseDto> getPendingRequests(Long userId) {
        List<Friendship> pendingRequests = friendshipRepository.findByFriendIdAndStatus(userId, "pending");

        return pendingRequests.stream().map(f -> {
            // Lấy thông tin người gửi
            String senderUsername = userRepository.findById(f.getUserId())
                    .map(User::getUsername)
                    .orElse("Unknown");

            return FriendRequestResponseDto.builder()
                    .id(f.getId())
                    .userId(f.getUserId())
                    .friendId(f.getFriendId())
                    .status(f.getStatus())
                    .senderUsername(senderUsername)
                    .build();
        }).collect(Collectors.toList());
    }

    // Lấy gợi ý kết bạn (bỏ qua bản thân, bạn bè, và người đã gửi/nhận lời mời)
    public List<com.example.backend_java.dto.UserResponseDto> getSuggestions(Long userId) {
        // Lấy tất cả quan hệ bạn bè liên quan đến userId (cả gửi đi và nhận lại, mọi status)
        List<Friendship> relatedFriendships = friendshipRepository.findAll().stream()
                .filter(f -> f.getUserId().equals(userId) || f.getFriendId().equals(userId))
                .collect(Collectors.toList());

        // Tập hợp ID của những người cần loại trừ
        java.util.Set<Long> excludedUserIds = relatedFriendships.stream()
                .map(f -> f.getUserId().equals(userId) ? f.getFriendId() : f.getUserId())
                .collect(Collectors.toSet());
        
        // Thêm chính mình vào danh sách loại trừ
        excludedUserIds.add(userId);

        return userRepository.findAll().stream()
                .filter(u -> !excludedUserIds.contains(u.getId()))
                .map(u -> com.example.backend_java.dto.UserResponseDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .avatarUrl(u.getAvatarUrl())
                        .coverUrl(u.getCoverUrl())
                        .bio(u.getBio())
                        .build())
                .collect(Collectors.toList());
    }

    private FriendshipResponseDto toResponseDto(Friendship friendship) {
        return FriendshipResponseDto.builder()
                .id(friendship.getId())
                .userId(friendship.getUserId())
                .friendId(friendship.getFriendId())
                .status(friendship.getStatus())
                .build();
    }
}
