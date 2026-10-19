package com.example.backend_java.service;

import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.user.BlockStatusDto;
import com.example.backend_java.dto.user.BlockedUserDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.entity.UserBlock;
import com.example.backend_java.repository.FriendshipRepository;
import com.example.backend_java.repository.UserBlockRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    public UserBlockService(UserBlockRepository userBlockRepository,
                            UserRepository userRepository,
                            FriendshipRepository friendshipRepository) {
        this.userBlockRepository = userBlockRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    public MessageDto blockUser(Long targetUserId, User currentUser) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự chặn chính mình.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

        if (!userBlockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), targetUserId)) {
            UserBlock block = UserBlock.builder()
                    .blocker(currentUser)
                    .blocked(targetUser)
                    .build();
            userBlockRepository.save(block);
        }

        // Hủy mọi quan hệ bạn bè hoặc lời mời kết bạn giữa 2 bên
        try {
            friendshipRepository.deleteFriendshipBetweenUsers(currentUser.getId(), targetUserId);
        } catch (Exception e) {
            System.err.println("Could not delete friendships between blocked users: " + e.getMessage());
        }

        return new MessageDto("Đã chặn người dùng " + targetUser.getUsername() + " thành công.");
    }

    @Transactional
    public MessageDto unblockUser(Long targetUserId, User currentUser) {
        userBlockRepository.deleteByBlockerIdAndBlockedId(currentUser.getId(), targetUserId);
        return new MessageDto("Đã gỡ chặn người dùng thành công.");
    }

    @Transactional(readOnly = true)
    public List<BlockedUserDto> getBlockedUsers(User currentUser) {
        List<UserBlock> blocks = userBlockRepository.findByBlockerIdOrderByCreatedAtDesc(currentUser.getId());
        return blocks.stream().map(b -> {
            User u = b.getBlocked();
            return BlockedUserDto.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .fullName(u.getFullName())
                    .avatarUrl(u.getAvatarUrl())
                    .blockedAt(b.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BlockStatusDto getBlockStatus(Long targetUserId, Long currentUserId) {
        if (currentUserId == null || targetUserId == null) {
            return BlockStatusDto.builder()
                    .isBlockedByMe(false)
                    .isBlockedByThem(false)
                    .isBlocked(false)
                    .build();
        }

        boolean isBlockedByMe = userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, targetUserId);
        boolean isBlockedByThem = userBlockRepository.existsByBlockerIdAndBlockedId(targetUserId, currentUserId);

        return BlockStatusDto.builder()
                .isBlockedByMe(isBlockedByMe)
                .isBlockedByThem(isBlockedByThem)
                .isBlocked(isBlockedByMe || isBlockedByThem)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEither(Long u1, Long u2) {
        if (u1 == null || u2 == null) return false;
        return userBlockRepository.isBlockedEither(u1, u2);
    }

    @Transactional(readOnly = true)
    public Set<Long> getAllBlockedRelatedUserIds(Long userId) {
        if (userId == null) return Collections.emptySet();
        return userBlockRepository.findAllBlockedRelatedUserIds(userId);
    }
}
