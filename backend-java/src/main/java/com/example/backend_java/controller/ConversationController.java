package com.example.backend_java.controller;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.ChatMessageService;
import com.example.backend_java.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final ChatMessageService chatMessageService;

    @GetMapping
    public ResponseEntity<List<ConversationResponseDto>> getConversations(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.getConversations(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponseDto> getConversationById(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.getConversationById(id, currentUser));
    }

    @PostMapping("/direct")
    public ResponseEntity<ConversationResponseDto> getOrCreateDirectConversation(
            @Valid @RequestBody CreateDirectConversationDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.getOrCreateDirectConversation(currentUser, request.getUserId()));
    }

    @PostMapping("/group")
    public ResponseEntity<ConversationResponseDto> createGroupConversation(
            @Valid @RequestBody CreateGroupConversationDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.createGroupConversation(currentUser, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConversationResponseDto> updateGroup(
            @PathVariable Long id,
            @RequestBody UpdateGroupDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.updateGroup(id, request, currentUser));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ConversationResponseDto> addMembers(
            @PathVariable Long id,
            @Valid @RequestBody AddMembersDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.addMembers(id, request, currentUser));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        conversationService.removeMember(id, userId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveConversation(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        conversationService.leaveConversation(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(chatMessageService.getMessages(id, currentUser, pageable));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatMessageResponseDto> sendMessage(
            @PathVariable Long id,
            @RequestBody ChatMessageRequestDto request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        request.setConversationId(id);
        return ResponseEntity.ok(chatMessageService.sendMessage(currentUser, request));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        chatMessageService.markAsRead(id, currentUser);
        return ResponseEntity.ok().build();
    }
}
