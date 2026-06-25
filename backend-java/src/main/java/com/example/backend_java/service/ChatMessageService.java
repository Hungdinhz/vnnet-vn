package com.example.backend_java.service;

import com.example.backend_java.dto.ChatMessageRequestDto;
import com.example.backend_java.dto.ChatMessageResponseDto;
import com.example.backend_java.dto.ConversationDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.ChatMessage;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.ChatMessageRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatMessageResponseDto sendMessage(User sender, ChatMessageRequestDto request) {
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người nhận không tồn tại."));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .isRead(false)
                .build();

        ChatMessage savedMessage = messageRepository.save(message);
        return mapToResponseDto(savedMessage);
    }

    @Transactional
    public List<ChatMessageResponseDto> getChatHistory(User currentUser, Long contactId) {
        User contact = userRepository.findById(contactId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));

        List<ChatMessage> history = messageRepository.findChatHistory(currentUser.getId(), contact.getId());

        // Đánh dấu các tin nhắn người kia gửi cho mình là đã đọc
        history.stream()
                .filter(m -> m.getReceiver().getId().equals(currentUser.getId()) && !m.getIsRead())
                .forEach(m -> {
                    m.setIsRead(true);
                    messageRepository.save(m);
                });

        return history.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public List<ConversationDto> getRecentConversations(User currentUser) {
        List<ChatMessage> recentMessages = messageRepository.findRecentConversations(currentUser.getId());

        return recentMessages.stream().map(message -> {
            User contact = message.getSender().getId().equals(currentUser.getId()) ? message.getReceiver() : message.getSender();
            Long unreadCount = messageRepository.countUnreadMessages(currentUser.getId(), contact.getId());

            return ConversationDto.builder()
                    .contact(mapUserToDto(contact))
                    .lastMessage(message.getContent())
                    .lastMessageTime(message.getCreatedAt())
                    .unreadCount(unreadCount)
                    .build();
        }).collect(Collectors.toList());
    }

    private ChatMessageResponseDto mapToResponseDto(ChatMessage message) {
        return ChatMessageResponseDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .receiverId(message.getReceiver().getId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .isRead(message.getIsRead())
                .build();
    }

    private UserResponseDto mapUserToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .bio(user.getBio())
                .build();
    }
}
