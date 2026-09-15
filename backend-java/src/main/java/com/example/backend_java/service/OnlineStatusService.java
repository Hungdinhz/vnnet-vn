package com.example.backend_java.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OnlineStatusService {

    // userId -> active WebSocket session count
    private final Map<Long, Integer> activeSessions = new ConcurrentHashMap<>();
    
    // userId -> last seen timestamp
    private final Map<Long, LocalDateTime> lastSeen = new ConcurrentHashMap<>();

    public synchronized void userConnected(Long userId) {
        if (userId == null) return;
        int count = activeSessions.getOrDefault(userId, 0);
        activeSessions.put(userId, count + 1);
        lastSeen.put(userId, LocalDateTime.now());
    }

    public synchronized boolean userDisconnected(Long userId) {
        if (userId == null) return false;
        int count = activeSessions.getOrDefault(userId, 1) - 1;
        if (count <= 0) {
            activeSessions.remove(userId);
            lastSeen.put(userId, LocalDateTime.now());
            return true; // Now offline
        } else {
            activeSessions.put(userId, count);
            return false; // Still has other sessions
        }
    }

    public boolean isUserOnline(Long userId) {
        if (userId == null) return false;
        return activeSessions.getOrDefault(userId, 0) > 0;
    }

    public LocalDateTime getLastSeen(Long userId) {
        if (userId == null) return null;
        return lastSeen.get(userId);
    }
}
