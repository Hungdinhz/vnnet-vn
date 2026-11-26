package com.example.backend_java.game.controller;

import com.example.backend_java.entity.User;
import com.example.backend_java.game.dto.GameActionRequest;
import com.example.backend_java.game.engine.GameRoomManager;
import com.example.backend_java.game.engine.MatchmakingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class GameWsController {

    private final GameRoomManager roomManager;
    private final MatchmakingService matchmakingService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/game.room.ready")
    public void toggleReady(@Payload Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        try {
            roomManager.toggleReady(user, payload.get("roomCode"));
        } catch (Exception e) {
            sendError(user, e.getMessage());
        }
    }

    @MessageMapping("/game.room.start")
    public void startRoom(@Payload Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        try {
            roomManager.startRoom(user, payload.get("roomCode"));
        } catch (Exception e) {
            sendError(user, e.getMessage());
        }
    }

    @MessageMapping("/game.room.leave")
    public void leaveRoom(@Payload Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        roomManager.leaveRoom(user.getId(), payload.get("roomCode"));
    }

    @MessageMapping("/game.action")
    public void handleAction(@Payload GameActionRequest request, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        try {
            roomManager.handleAction(user, request);
        } catch (Exception e) {
            sendError(user, e.getMessage());
        }
    }

    @MessageMapping("/game.chat")
    public void sendChat(@Payload Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        roomManager.sendChat(user, payload.get("roomCode"), payload.get("content"), payload.get("type"));
    }

    @MessageMapping("/game.matchmaking.join")
    public void joinMatchmaking(@Payload(required = false) Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        String gameSlug = payload != null ? payload.get("gameSlug") : null;
        Map<String, Object> result = matchmakingService.joinQueue(user, gameSlug);
        if ("QUEUED".equals(result.get("type"))) {
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/game.events", result);
        }
    }

    @MessageMapping("/game.matchmaking.cancel")
    public void cancelMatchmaking(@Payload(required = false) Map<String, String> payload, Principal principal) {
        User user = extractUser(principal);
        if (user == null) return;
        String gameSlug = payload != null ? payload.get("gameSlug") : null;
        matchmakingService.cancelQueue(user.getId(), gameSlug);
    }

    private User extractUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof User user) {
            return user;
        }
        return null;
    }

    private void sendError(User user, String message) {
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/game.events", Map.of(
                "type", "ERROR",
                "message", message != null ? message : "Thao tác không hợp lệ"
        ));
    }
}
