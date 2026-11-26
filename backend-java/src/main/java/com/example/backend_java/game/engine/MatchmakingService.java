package com.example.backend_java.game.engine;

import com.example.backend_java.entity.User;
import com.example.backend_java.game.caro.CaroEngine;
import com.example.backend_java.game.dto.RoomStateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final GameRoomManager roomManager;
    private final SimpMessagingTemplate messagingTemplate;

    // gameSlug -> ordered queue of waiting users
    private final ConcurrentHashMap<String, LinkedHashMap<Long, User>> queues = new ConcurrentHashMap<>();

    public synchronized Map<String, Object> joinQueue(User user, String rawSlug) {
        String slug = (rawSlug == null || rawSlug.isBlank()) ? CaroEngine.SLUG : rawSlug.trim().toLowerCase();
        LinkedHashMap<Long, User> queue = queues.computeIfAbsent(slug, k -> new LinkedHashMap<>());

        // Remove if already waiting
        queue.remove(user.getId());

        // Pair immediately if another user is waiting
        Iterator<Map.Entry<Long, User>> it = queue.entrySet().iterator();
        if (it.hasNext()) {
            User opponent = it.next().getValue();
            it.remove();

            RoomStateDto room = roomManager.createMatchedRoom(slug, opponent, user);

            Map<String, Object> matchFoundEvent = Map.of(
                    "type", "MATCH_FOUND",
                    "roomCode", room.getRoomCode(),
                    "gameSlug", slug,
                    "room", room
            );
            messagingTemplate.convertAndSendToUser(opponent.getEmail(), "/queue/game.events", matchFoundEvent);
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/game.events", matchFoundEvent);
            return matchFoundEvent;
        }

        queue.put(user.getId(), user);
        return Map.of(
                "type", "QUEUED",
                "gameSlug", slug,
                "queueSize", queue.size()
        );
    }

    public synchronized void cancelQueue(Long userId, String rawSlug) {
        if (rawSlug != null && !rawSlug.isBlank()) {
            LinkedHashMap<Long, User> q = queues.get(rawSlug.trim().toLowerCase());
            if (q != null) q.remove(userId);
            return;
        }
        queues.values().forEach(q -> q.remove(userId));
    }
}
