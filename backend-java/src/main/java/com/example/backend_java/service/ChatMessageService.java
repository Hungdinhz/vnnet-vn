package com.example.backend_java.service;

import com.example.backend_java.dto.ChatMessageRequestDto;
import com.example.backend_java.dto.ChatMessageResponseDto;
import com.example.backend_java.dto.ConversationDto;
import com.example.backend_java.dto.ConversationResponseDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.ChatMessageRepository;
import com.example.backend_java.repository.ConversationMemberRepository;
import com.example.backend_java.repository.ConversationRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ConversationService conversationService;
    @Lazy
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponseDto sendMessage(User sender, ChatMessageRequestDto request) {
        Conversation conversation;

        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));
            boolean isMember = memberRepository.existsByConversationIdAndUserId(conversation.getId(), sender.getId());
            if (!isMember) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này.");
            }
        } else if (request.getReceiverId() != null) {
            ConversationResponseDto convDto = conversationService.getOrCreateDirectConversation(sender, request.getReceiverId());
            conversation = conversationRepository.findById(convDto.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không thể tạo cuộc trò chuyện."));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần có conversationId hoặc receiverId.");
        }

        ChatMessage replyTo = null;
        if (request.getReplyToId() != null) {
            replyTo = messageRepository.findById(request.getReplyToId()).orElse(null);
        }

        User receiver = null;
        if (conversation.getType() == ConversationType.DIRECT) {
            List<ConversationMember> members = memberRepository.findByConversationId(conversation.getId());
            receiver = members.stream()
                    .filter(m -> !m.getUser().getId().equals(sender.getId()))
                    .map(ConversationMember::getUser)
                    .findFirst()
                    .orElse(null);
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent() != null ? request.getContent() : "")
                .messageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT)
                .imageUrl(request.getImageUrl())
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName())
                .fileSize(request.getFileSize())
                .replyTo(replyTo)
                .isDeleted(false)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = messageRepository.save(message);

        // Update conversation updated_at
        conversation.setUpdatedAt(saved.getCreatedAt());
        conversationRepository.save(conversation);

        // Update sender's last read
        Optional<ConversationMember> senderMemberOpt = memberRepository.findByConversationIdAndUserId(conversation.getId(), sender.getId());
        senderMemberOpt.ifPresent(m -> {
            m.setLastReadAt(saved.getCreatedAt());
            memberRepository.save(m);
        });

        ChatMessageResponseDto responseDto = mapToResponseDto(saved);

        // Broadcast to WebSocket subscribers of this conversation
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId(), responseDto);

                // Notify all members to refresh conversation list
                List<ConversationMember> members = memberRepository.findByConversationId(conversation.getId());
                for (ConversationMember member : members) {
                    messagingTemplate.convertAndSendToUser(
                            member.getUser().getEmail(),
                            "/queue/conversations",
                            conversationService.mapToResponseDto(conversation, member.getUser())
                    );
                }
            }
        } catch (Exception e) {
            // Log warning but don't fail transaction
            System.err.println("Could not broadcast WebSocket message: " + e.getMessage());
        }

        return responseDto;
    }

    @Transactional
    public List<ChatMessageResponseDto> getMessages(Long conversationId, User currentUser, Pageable pageable) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));

        ConversationMember member = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này."));

        // Update last read time
        member.setLastReadAt(LocalDateTime.now());
        memberRepository.save(member);

        Page<ChatMessage> page = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
        List<ChatMessage> list = page.getContent();
        // Reverse so frontend gets chronological order
        List<ChatMessageResponseDto> dtos = list.stream().map(this::mapToResponseDto).collect(Collectors.toList());
        Collections.reverse(dtos);
        return dtos;
    }

    @Transactional
    public void markAsRead(Long conversationId, User currentUser) {
        ConversationMember member = memberRepository.findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin thành viên."));

        member.setLastReadAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    @Transactional
    public ChatMessageResponseDto deleteMessage(Long messageId, User currentUser) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tin nhắn không tồn tại."));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ có thể thu hồi tin nhắn của mình.");
        }

        message.setIsDeleted(true);
        message.setContent("Tin nhắn đã được thu hồi");
        message.setImageUrl(null);
        ChatMessage saved = messageRepository.save(message);

        ChatMessageResponseDto dto = mapToResponseDto(saved);
        if (message.getConversation() != null && messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/conversation." + message.getConversation().getId(), dto);
        }

        return dto;
    }

    // --- Legacy / Backward Compatibility Methods ---

    @Transactional
    public List<ChatMessageResponseDto> getChatHistory(User currentUser, Long contactId) {
        ConversationResponseDto conv = conversationService.getOrCreateDirectConversation(currentUser, contactId);
        return getMessages(conv.getId(), currentUser, Pageable.unpaged());
    }

    public List<ConversationDto> getRecentConversations(User currentUser) {
        List<ConversationResponseDto> list = conversationService.getConversations(currentUser);
        return list.stream().map(c -> {
            UserResponseDto contact = null;
            if (c.getType() == ConversationType.DIRECT) {
                Optional<com.example.backend_java.dto.ConversationMemberDto> other = c.getMembers().stream()
                        .filter(m -> !m.getUserId().equals(currentUser.getId()))
                        .findFirst();
                if (other.isPresent()) {
                    contact = UserResponseDto.builder()
                            .id(other.get().getUserId())
                            .username(other.get().getUsername())
                            .avatarUrl(other.get().getAvatarUrl())
                            .build();
                }
            } else {
                contact = UserResponseDto.builder()
                        .id(c.getId())
                        .username(c.getName())
                        .avatarUrl(c.getAvatarUrl())
                        .build();
            }

            return ConversationDto.builder()
                    .contact(contact)
                    .lastMessage(c.getLastMessage())
                    .lastMessageTime(c.getLastMessageTime())
                    .unreadCount(c.getUnreadCount())
                    .build();
        }).collect(Collectors.toList());
    }

    public ChatMessageResponseDto mapToResponseDto(ChatMessage message) {
        String replyContent = null;
        String replySender = null;
        Long replyId = null;
        if (message.getReplyTo() != null) {
            replyId = message.getReplyTo().getId();
            replyContent = message.getReplyTo().getIsDeleted() ? "Tin nhắn đã bị thu hồi" : message.getReplyTo().getContent();
            replySender = message.getReplyTo().getSender().getUsername();
        }

        return ChatMessageResponseDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .content(message.getContent())
                .messageType(message.getMessageType())
                .imageUrl(message.getImageUrl())
                .fileUrl(message.getFileUrl())
                .fileName(message.getFileName())
                .fileSize(message.getFileSize())
                .replyToId(replyId)
                .replyToContent(replyContent)
                .replyToSenderUsername(replySender)
                .isDeleted(message.getIsDeleted())
                .createdAt(message.getCreatedAt())
                .isRead(message.getIsRead())
                .build();
    }
}
