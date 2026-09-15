package com.example.backend_java.controller;

import com.example.backend_java.dto.ChatMessageRequestDto;
import com.example.backend_java.dto.ReadReceiptDto;
import com.example.backend_java.dto.TypingEventDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void handleSendMessage(@Payload ChatMessageRequestDto request, Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user != null) {
            chatMessageService.sendMessage(user, request);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingEventDto event, Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user != null && event.getConversationId() != null) {
            event.setUserId(user.getId());
            event.setUsername(user.getUsername());
            messagingTemplate.convertAndSend("/topic/conversation." + event.getConversationId() + ".typing", event);
        }
    }

    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload ReadReceiptDto receipt, Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user != null && receipt.getConversationId() != null) {
            chatMessageService.markAsRead(receipt.getConversationId(), user);
            receipt.setUserId(user.getId());
            receipt.setReadAt(LocalDateTime.now());
            messagingTemplate.convertAndSend("/topic/conversation." + receipt.getConversationId() + ".read", receipt);
        }
    }

    private User getUserFromPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                return user;
            }
        }
        return null;
    }
}
