package com.example.backend_java.service;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OnlineStatusService onlineStatusService;

    @Transactional(readOnly = true)
    public List<ConversationResponseDto> getConversations(User currentUser) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUser.getId());
        return conversations.stream()
                .map(conv -> mapToResponseDto(conv, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponseDto getConversationById(Long conversationId, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));

        boolean isMember = memberRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập cuộc trò chuyện này.");
        }

        return mapToResponseDto(conv, currentUser);
    }

    @Transactional
    public ConversationResponseDto getOrCreateDirectConversation(User currentUser, Long targetUserId) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tạo cuộc trò chuyện với chính mình.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));

        List<Conversation> existing = conversationRepository.findDirectConversations(currentUser.getId(), targetUserId);
        if (!existing.isEmpty()) {
            return mapToResponseDto(existing.get(0), currentUser);
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .creator(currentUser)
                .build();
        conversation = conversationRepository.save(conversation);

        ConversationMember member1 = ConversationMember.builder()
                .conversation(conversation)
                .user(currentUser)
                .role("ADMIN")
                .lastReadAt(LocalDateTime.now())
                .build();

        ConversationMember member2 = ConversationMember.builder()
                .conversation(conversation)
                .user(targetUser)
                .role("MEMBER")
                .lastReadAt(LocalDateTime.now())
                .build();

        memberRepository.save(member1);
        memberRepository.save(member2);

        conversation.getMembers().add(member1);
        conversation.getMembers().add(member2);

        return mapToResponseDto(conversation, currentUser);
    }

    @Transactional
    public ConversationResponseDto createGroupConversation(User currentUser, CreateGroupConversationDto request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên nhóm không được để trống.");
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .name(request.getName().trim())
                .avatarUrl(request.getAvatarUrl())
                .creator(currentUser)
                .build();
        final Conversation savedConv = conversationRepository.save(conversation);

        List<ConversationMember> members = new ArrayList<>();
        // Add creator as ADMIN
        ConversationMember adminMember = ConversationMember.builder()
                .conversation(savedConv)
                .user(currentUser)
                .role("ADMIN")
                .lastReadAt(LocalDateTime.now())
                .build();
        members.add(adminMember);

        // Add requested members
        Set<Long> addedUserIds = new HashSet<>();
        addedUserIds.add(currentUser.getId());

        if (request.getMemberIds() != null) {
            for (Long uid : request.getMemberIds()) {
                if (uid != null && !addedUserIds.contains(uid)) {
                    userRepository.findById(uid).ifPresent(u -> {
                        members.add(ConversationMember.builder()
                                .conversation(savedConv)
                                .user(u)
                                .role("MEMBER")
                                .lastReadAt(LocalDateTime.now())
                                .build());
                        addedUserIds.add(uid);
                    });
                }
            }
        }

        memberRepository.saveAll(members);
        savedConv.setMembers(members);

        return mapToResponseDto(savedConv, currentUser);
    }

    @Transactional
    public ConversationResponseDto addMembers(Long conversationId, AddMembersDto request, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm."));

        if (conv.getType() != ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể thêm thành viên vào nhóm.");
        }

        boolean isMember = memberRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này.");
        }

        List<ConversationMember> currentMembers = memberRepository.findByConversationId(conversationId);
        Set<Long> existingIds = currentMembers.stream().map(m -> m.getUser().getId()).collect(Collectors.toSet());

        List<ConversationMember> newMembers = new ArrayList<>();
        if (request.getMemberIds() != null) {
            for (Long uid : request.getMemberIds()) {
                if (uid != null && !existingIds.contains(uid)) {
                    userRepository.findById(uid).ifPresent(u -> {
                        newMembers.add(ConversationMember.builder()
                                .conversation(conv)
                                .user(u)
                                .role("MEMBER")
                                .lastReadAt(LocalDateTime.now())
                                .build());
                        existingIds.add(uid);
                    });
                }
            }
        }

        if (!newMembers.isEmpty()) {
            memberRepository.saveAll(newMembers);
            conv.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conv);
        }

        return mapToResponseDto(conv, currentUser);
    }

    @Transactional
    public void removeMember(Long conversationId, Long targetUserId, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm."));

        if (conv.getType() != ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể xóa thành viên khỏi nhóm.");
        }

        ConversationMember actor = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này."));

        if (!"ADMIN".equals(actor.getRole()) && !currentUser.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ quản trị viên mới có quyền xóa thành viên.");
        }

        memberRepository.deleteByConversationIdAndUserId(conversationId, targetUserId);
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);
    }

    @Transactional
    public void leaveConversation(Long conversationId, User currentUser) {
        removeMember(conversationId, currentUser.getId(), currentUser);
    }

    @Transactional
    public ConversationResponseDto updateGroup(Long conversationId, UpdateGroupDto request, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm."));

        if (conv.getType() != ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể cập nhật nhóm.");
        }

        ConversationMember actor = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này."));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            conv.setName(request.getName().trim());
        }
        if (request.getAvatarUrl() != null) {
            conv.setAvatarUrl(request.getAvatarUrl());
        }

        conv.setUpdatedAt(LocalDateTime.now());
        conv = conversationRepository.save(conv);

        return mapToResponseDto(conv, currentUser);
    }

    public ConversationResponseDto mapToResponseDto(Conversation conv, User currentUser) {
        List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());

        List<ConversationMemberDto> memberDtos = members.stream().map(m -> {
            User u = m.getUser();
            boolean isOnline = onlineStatusService.isUserOnline(u.getId());
            LocalDateTime lastSeen = onlineStatusService.getLastSeen(u.getId());
            return ConversationMemberDto.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .avatarUrl(u.getAvatarUrl())
                    .role(m.getRole())
                    .joinedAt(m.getJoinedAt())
                    .isOnline(isOnline)
                    .lastSeen(lastSeen)
                    .build();
        }).collect(Collectors.toList());

        String displayName = conv.getName();
        String displayAvatar = conv.getAvatarUrl();

        // For direct conversation, pick partner's username and avatar
        if (conv.getType() == ConversationType.DIRECT) {
            Optional<ConversationMember> partner = members.stream()
                    .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                    .findFirst();
            if (partner.isPresent()) {
                displayName = partner.get().getUser().getUsername();
                displayAvatar = partner.get().getUser().getAvatarUrl();
            } else if (!members.isEmpty()) {
                displayName = members.get(0).getUser().getUsername();
                displayAvatar = members.get(0).getUser().getAvatarUrl();
            }
        }

        // Find last message
        Optional<ChatMessage> latestMsg = messageRepository.findTop1ByConversationIdOrderByCreatedAtDesc(conv.getId());
        String lastMessage = latestMsg.map(ChatMessage::getContent).orElse(null);
        LocalDateTime lastMessageTime = latestMsg.map(ChatMessage::getCreatedAt).orElse(conv.getUpdatedAt());
        String lastMessageSenderName = latestMsg.map(m -> m.getSender().getUsername()).orElse(null);

        // Find unread count
        Long unreadCount = 0L;
        Optional<ConversationMember> currentMemberOpt = members.stream()
                .filter(m -> m.getUser().getId().equals(currentUser.getId()))
                .findFirst();
        if (currentMemberOpt.isPresent()) {
            LocalDateTime lastReadAt = currentMemberOpt.get().getLastReadAt();
            if (lastReadAt == null) {
                lastReadAt = LocalDateTime.of(1970, 1, 1, 0, 0);
            }
            unreadCount = messageRepository.countUnreadInConversation(conv.getId(), currentUser.getId(), lastReadAt);
        }

        return ConversationResponseDto.builder()
                .id(conv.getId())
                .type(conv.getType())
                .name(displayName)
                .avatarUrl(displayAvatar)
                .creatorId(conv.getCreator() != null ? conv.getCreator().getId() : null)
                .members(memberDtos)
                .lastMessage(lastMessage)
                .lastMessageTime(lastMessageTime)
                .lastMessageSenderName(lastMessageSenderName)
                .unreadCount(unreadCount)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}
