package com.example.backend_java.config;

import com.example.backend_java.dto.OnlineStatusDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.OnlineStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineStatusService onlineStatusService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                onlineStatusService.userConnected(user.getId());
                messagingTemplate.convertAndSend("/topic/online",
                        OnlineStatusDto.builder()
                                .userId(user.getId())
                                .isOnline(true)
                                .lastSeen(LocalDateTime.now())
                                .build());
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                boolean nowOffline = onlineStatusService.userDisconnected(user.getId());
                if (nowOffline) {
                    messagingTemplate.convertAndSend("/topic/online",
                            OnlineStatusDto.builder()
                                    .userId(user.getId())
                                    .isOnline(false)
                                    .lastSeen(LocalDateTime.now())
                                    .build());
                }
            }
        }
    }
}
