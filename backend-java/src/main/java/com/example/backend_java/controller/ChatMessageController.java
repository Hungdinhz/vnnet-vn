package com.example.backend_java.controller;

import com.example.backend_java.dto.ChatMessageRequestDto;
import com.example.backend_java.dto.ChatMessageResponseDto;
import com.example.backend_java.dto.ConversationDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.ChatMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService messageService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(messageService.getRecentConversations(currentUser));
    }

    @GetMapping("/{contactId}")
    public ResponseEntity<List<ChatMessageResponseDto>> getChatHistory(
            @PathVariable Long contactId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(messageService.getChatHistory(currentUser, contactId));
    }

    @PostMapping
    public ResponseEntity<ChatMessageResponseDto> sendMessage(
            @Valid @RequestBody ChatMessageRequestDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(messageService.sendMessage(currentUser, request));
    }
}
