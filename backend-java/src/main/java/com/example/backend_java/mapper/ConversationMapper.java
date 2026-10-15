package com.example.backend_java.mapper;

import com.example.backend_java.dto.chat.ConversationMemberDto;
import com.example.backend_java.dto.chat.ConversationResponseDto;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.ChatMessageRepository;
import com.example.backend_java.repository.ConversationMemberRepository;
import com.example.backend_java.service.OnlineStatusService;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ConversationMapper {

    private final ChatMessageRepository messageRepository;
    private final ConversationMemberRepository memberRepository;
    private final OnlineStatusService onlineStatusService;

    public ConversationMapper(ChatMessageRepository messageRepository,
                              ConversationMemberRepository memberRepository,
                              OnlineStatusService onlineStatusService) {
        this.messageRepository = messageRepository;
        this.memberRepository = memberRepository;
        this.onlineStatusService = onlineStatusService;
    }

    public ConversationResponseDto toResponseDto(Conversation conv, User currentUser) {
        List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
        return toResponseDto(conv, currentUser, members);
    }

    public ConversationResponseDto toResponseDto(Conversation conv, User currentUser, List<ConversationMember> members) {
        List<ConversationMemberDto> memberDtos = members.stream().map(m -> {
            User u = m.getUser();
            boolean isOnline = onlineStatusService.isUserOnline(u.getId());
            LocalDateTime lastSeen = onlineStatusService.getLastSeen(u.getId());
            return ConversationMemberDto.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .nickname(m.getNickname())
                    .avatarUrl(u.getAvatarUrl())
                    .role(m.getRole())
                    .joinedAt(m.getJoinedAt())
                    .isOnline(isOnline)
                    .lastSeen(lastSeen)
                    .build();
        }).collect(Collectors.toList());

        String displayName = conv.getName();
        String displayAvatar = conv.getAvatarUrl();

        // For direct conversation, pick partner's username (or nickname) and avatar
        if (conv.getType() == ConversationType.DIRECT) {
            Optional<ConversationMember> partner = members.stream()
                    .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                    .findFirst();
            if (partner.isPresent()) {
                String nick = partner.get().getNickname();
                displayName = (nick != null && !nick.trim().isEmpty()) ? nick : partner.get().getUser().getUsername();
                displayAvatar = partner.get().getUser().getAvatarUrl();
            } else if (!members.isEmpty()) {
                String nick = members.get(0).getNickname();
                displayName = (nick != null && !nick.trim().isEmpty()) ? nick : members.get(0).getUser().getUsername();
                displayAvatar = members.get(0).getUser().getAvatarUrl();
            }
        }

        // Find last message
        Optional<ChatMessage> latestMsg = messageRepository.findTop1ByConversationIdOrderByCreatedAtDesc(conv.getId());
        String lastMessage = null;
        LocalDateTime lastMessageTime = conv.getUpdatedAt();
        String lastMessageSenderName = null;

        if (latestMsg.isPresent()) {
            ChatMessage msg = latestMsg.get();
            lastMessageTime = msg.getCreatedAt();
            User sender = msg.getSender();
            boolean isMe = sender != null && sender.getId().equals(currentUser.getId());

            String senderDisplayName = isMe ? "Bạn" : (sender != null ? sender.getUsername() : "Người dùng");
            if (!isMe && sender != null) {
                for (ConversationMember m : members) {
                    if (m.getUser().getId().equals(sender.getId())) {
                        if (m.getNickname() != null && !m.getNickname().trim().isEmpty()) {
                            senderDisplayName = m.getNickname().trim();
                        }
                        break;
                    }
                }
            }
            lastMessageSenderName = senderDisplayName;

            if (msg.getMessageType() == MessageType.SYSTEM) {
                String sysContent = msg.getContent() != null ? msg.getContent() : "";
                for (ConversationMember m : members) {
                    if (m.getNickname() != null && !m.getNickname().trim().isEmpty() && m.getUser() != null) {
                        sysContent = sysContent.replace(m.getUser().getUsername(), m.getNickname().trim());
                    }
                }
                lastMessage = sysContent;
            } else if (msg.getMessageType() == MessageType.IMAGE || (msg.getImageUrl() != null && !msg.getImageUrl().isEmpty())) {
                if (msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                    lastMessage = senderDisplayName + " đã gửi một hình ảnh: " + msg.getContent().trim();
                } else {
                    lastMessage = senderDisplayName + " đã gửi một hình ảnh";
                }
            } else if (msg.getMessageType() == MessageType.FILE || (msg.getFileUrl() != null && !msg.getFileUrl().isEmpty())) {
                String fName = (msg.getFileName() != null && !msg.getFileName().trim().isEmpty())
                        ? msg.getFileName().trim()
                        : "tệp";
                if (msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                    lastMessage = senderDisplayName + " đã gửi một tệp (" + fName + "): " + msg.getContent().trim();
                } else {
                    lastMessage = senderDisplayName + " đã gửi một tệp: " + fName;
                }
            } else {
                if (conv.getType() == ConversationType.GROUP) {
                    lastMessage = senderDisplayName + ": " + (msg.getContent() != null ? msg.getContent() : "");
                } else {
                    lastMessage = (isMe ? "Bạn: " : "") + (msg.getContent() != null ? msg.getContent() : "");
                }
            }
        }

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
