package com.example.backend_java.service;

import com.example.backend_java.dto.auth.*;
import com.example.backend_java.dto.chat.*;
import com.example.backend_java.dto.common.*;
import com.example.backend_java.dto.event.*;
import com.example.backend_java.dto.game.*;
import com.example.backend_java.dto.notification.*;
import com.example.backend_java.dto.post.*;
import com.example.backend_java.dto.social.*;
import com.example.backend_java.dto.story.*;
import com.example.backend_java.dto.user.*;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import com.example.backend_java.mapper.ConversationMapper;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OnlineStatusService onlineStatusService;
    private final ConversationMapper conversationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationMemberRepository memberRepository,
                               ChatMessageRepository messageRepository,
                               UserRepository userRepository,
                               OnlineStatusService onlineStatusService,
                               ConversationMapper conversationMapper,
                               @Lazy SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.onlineStatusService = onlineStatusService;
        this.conversationMapper = conversationMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public List<ConversationResponseDto> getConversations(User currentUser) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUser.getId());
        
        // Deduplicate DIRECT conversations with the same partner
        Map<Long, Conversation> uniqueDirectByPartner = new LinkedHashMap<>();
        List<Conversation> finalConversations = new ArrayList<>();

        for (Conversation conv : conversations) {
            if (conv.getType() == ConversationType.DIRECT) {
                List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
                Optional<ConversationMember> partnerOpt = members.stream()
                        .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                        .findFirst();

                if (partnerOpt.isPresent()) {
                    Long partnerId = partnerOpt.get().getUser().getId();
                    if (uniqueDirectByPartner.containsKey(partnerId)) {
                        // Merge duplicate: reassign any messages to the kept conversation
                        Conversation kept = uniqueDirectByPartner.get(partnerId);
                        List<ChatMessage> orphanMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
                        for (ChatMessage m : orphanMessages) {
                            m.setConversation(kept);
                            messageRepository.save(m);
                        }
                        // Delete duplicate conversation members & conversation
                        try {
                            memberRepository.findByConversationId(conv.getId()).forEach(memberRepository::delete);
                            conversationRepository.delete(conv);
                        } catch (Exception e) {
                            System.err.println("Could not delete duplicate conversation: " + e.getMessage());
                        }
                    } else {
                        uniqueDirectByPartner.put(partnerId, conv);
                        finalConversations.add(conv);
                    }
                } else {
                    finalConversations.add(conv);
                }
            } else {
                finalConversations.add(conv);
            }
        }

        return finalConversations.stream()
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
    public ConversationResponseDto updateGroup(Long conversationId, UpdateConversationGroupDto request, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm."));

        if (conv.getType() != ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể cập nhật nhóm.");
        }

        ConversationMember actor = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này."));

        String oldName = conv.getName();
        boolean nameChanged = false;
        String newName = null;

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            newName = request.getName().trim();
            if (!newName.equals(oldName)) {
                conv.setName(newName);
                nameChanged = true;
            }
        }
        if (request.getAvatarUrl() != null) {
            conv.setAvatarUrl(request.getAvatarUrl());
        }

        conv.setUpdatedAt(LocalDateTime.now());
        conv = conversationRepository.save(conv);

        // Khi đổi tên nhóm, tạo và phát tin nhắn SYSTEM thông báo tới đoạn chat
        if (nameChanged) {
            String actorName = currentUser.getUsername();
            Optional<ConversationMember> currentMember = memberRepository.findByConversationIdAndUserId(conv.getId(), currentUser.getId());
            if (currentMember.isPresent() && currentMember.get().getNickname() != null && !currentMember.get().getNickname().trim().isEmpty()) {
                actorName = currentMember.get().getNickname().trim();
            }

            String systemText = actorName + " đã đổi tên nhóm thành \"" + newName + "\"";
            ChatMessage systemMessage = ChatMessage.builder()
                    .conversation(conv)
                    .sender(currentUser)
                    .content(systemText)
                    .messageType(MessageType.SYSTEM)
                    .isDeleted(false)
                    .isRead(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            ChatMessage savedMsg = messageRepository.save(systemMessage);

            ChatMessageResponseDto msgDto = ChatMessageResponseDto.builder()
                    .id(savedMsg.getId())
                    .conversationId(conv.getId())
                    .senderId(currentUser.getId())
                    .senderUsername(currentUser.getUsername())
                    .senderNickname(actorName)
                    .senderAvatarUrl(currentUser.getAvatarUrl())
                    .content(systemText)
                    .messageType(MessageType.SYSTEM)
                    .isDeleted(false)
                    .createdAt(savedMsg.getCreatedAt())
                    .isRead(true)
                    .build();

            try {
                if (messagingTemplate != null) {
                    // Phát tin nhắn thông báo vào đoạn chat nhóm
                    messagingTemplate.convertAndSend("/topic/conversation." + conv.getId(), msgDto);

                    // Phát sự kiện cập nhật thông tin hội thoại tới topic của hội thoại (cập nhật header ngay lập tức)
                    messagingTemplate.convertAndSend("/topic/conversation." + conv.getId() + ".info", mapToResponseDto(conv, currentUser));

                    // Cập nhật thông tin hội thoại cho tất cả các thành viên trong danh sách bên trái
                    List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
                    for (ConversationMember m : members) {
                        messagingTemplate.convertAndSendToUser(
                                m.getUser().getEmail(),
                                "/queue/conversations",
                                mapToResponseDto(conv, m.getUser())
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Error broadcasting group rename system message: " + e.getMessage());
            }
        }

        return mapToResponseDto(conv, currentUser);
    }

    @Transactional
    public ConversationResponseDto setMemberNickname(Long conversationId, Long targetUserId, String nickname, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));

        boolean isMember = memberRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này.");
        }

        ConversationMember targetMember = memberRepository.findByConversationIdAndUserId(conversationId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thành viên trong cuộc trò chuyện."));

        // Determine actor display name (use current nickname in this conversation if set, else username)
        Optional<ConversationMember> actorMember = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId());
        String actorName = currentUser.getUsername();
        if (actorMember.isPresent() && actorMember.get().getNickname() != null && !actorMember.get().getNickname().trim().isEmpty()) {
            actorName = actorMember.get().getNickname().trim();
        }

        // Determine target display name (use current nickname before change if present, else username)
        String targetName = targetMember.getUser().getUsername();
        if (targetMember.getNickname() != null && !targetMember.getNickname().trim().isEmpty()) {
            targetName = targetMember.getNickname().trim();
        }

        String cleanNickname = (nickname != null && !nickname.trim().isEmpty()) ? nickname.trim() : null;
        targetMember.setNickname(cleanNickname);
        memberRepository.save(targetMember);

        String systemContent;
        if (cleanNickname != null) {
            systemContent = actorName + " đã đặt biệt danh cho " + targetName + " là \"" + cleanNickname + "\"";
        } else {
            systemContent = actorName + " đã gỡ biệt danh của " + targetName;
        }

        ChatMessage systemMessage = ChatMessage.builder()
                .conversation(conv)
                .sender(currentUser)
                .content(systemContent)
                .messageType(MessageType.SYSTEM)
                .isDeleted(false)
                .isRead(true)
                .createdAt(LocalDateTime.now())
                .build();
        ChatMessage savedMsg = messageRepository.save(systemMessage);

        ChatMessageResponseDto msgDto = ChatMessageResponseDto.builder()
                .id(savedMsg.getId())
                .conversationId(conv.getId())
                .senderId(currentUser.getId())
                .senderUsername(currentUser.getUsername())
                .senderNickname(actorName)
                .senderAvatarUrl(currentUser.getAvatarUrl())
                .content(systemContent)
                .messageType(MessageType.SYSTEM)
                .isDeleted(false)
                .createdAt(savedMsg.getCreatedAt())
                .isRead(true)
                .build();

        conv.setUpdatedAt(LocalDateTime.now());
        conv = conversationRepository.save(conv);

        try {
            if (messagingTemplate != null) {
                // 1. Gửi tin nhắn SYSTEM vào khung chat
                messagingTemplate.convertAndSend("/topic/conversation." + conv.getId(), msgDto);

                // 2. Gửi thông tin hội thoại cập nhật tới topic để các client đang mở tự động cập nhật biệt danh
                messagingTemplate.convertAndSend("/topic/conversation." + conv.getId() + ".info", mapToResponseDto(conv, currentUser));

                // 3. Cập nhật danh sách hội thoại bên trái cho toàn bộ thành viên
                List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
                for (ConversationMember m : members) {
                    messagingTemplate.convertAndSendToUser(
                            m.getUser().getEmail(),
                            "/queue/conversations",
                            mapToResponseDto(conv, m.getUser())
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting nickname change: " + e.getMessage());
        }

        return mapToResponseDto(conv, currentUser);
    }

    public ConversationResponseDto mapToResponseDto(Conversation conv, User currentUser) {
        return conversationMapper.toResponseDto(conv, currentUser);
    }
}
