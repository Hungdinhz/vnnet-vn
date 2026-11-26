package com.example.backend_java.game.controller;

import com.example.backend_java.entity.User;
import com.example.backend_java.game.dto.*;
import com.example.backend_java.game.engine.GameMatchPersistenceService;
import com.example.backend_java.game.engine.GameRoomManager;
import com.example.backend_java.game.engine.MatchmakingService;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/games/multiplayer")
@RequiredArgsConstructor
public class GameRoomRestController {

    private final GameRoomManager roomManager;
    private final MatchmakingService matchmakingService;
    private final GameMatchPersistenceService persistenceService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/rooms")
    public ResponseEntity<List<RoomStateDto>> listPublicRooms(
            @RequestParam(required = false) String gameSlug) {
        return ResponseEntity.ok(roomManager.listPublicRooms(gameSlug));
    }

    @GetMapping("/rooms/active")
    public ResponseEntity<?> getMyActiveRoom(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        RoomStateDto active = roomManager.getActiveRoomForUser(currentUser.getId());
        if (active == null) {
            return ResponseEntity.ok(Map.of("active", false));
        }
        return ResponseEntity.ok(Map.of("active", true, "room", active));
    }

    @GetMapping("/rooms/{roomCode}")
    public ResponseEntity<RoomStateDto> getRoom(@PathVariable String roomCode) {
        return ResponseEntity.ok(roomManager.getRoomState(roomCode));
    }

    @PostMapping("/rooms")
    public ResponseEntity<RoomStateDto> createRoom(
            @RequestBody RoomCreateRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(roomManager.createRoom(currentUser, request));
    }

    @PostMapping("/rooms/{roomCode}/join")
    public ResponseEntity<RoomStateDto> joinRoom(
            @PathVariable String roomCode,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(roomManager.joinRoom(currentUser, roomCode));
    }

    @PostMapping("/rooms/{roomCode}/leave")
    public ResponseEntity<Map<String, Object>> leaveRoom(
            @PathVariable String roomCode,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        roomManager.leaveRoom(currentUser.getId(), roomCode);
        return ResponseEntity.ok(Map.of("left", true));
    }

    @PostMapping("/rooms/{roomCode}/invite")
    public ResponseEntity<Map<String, Object>> inviteFriend(
            @PathVariable String roomCode,
            @RequestBody Map<String, Long> body,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Long friendId = body.get("friendId");
        RoomStateDto room = roomManager.getRoomState(roomCode);
        if (friendId != null && !friendId.equals(currentUser.getId())) {
            notificationService.createNotification(friendId, currentUser.getId(), "game_invite", room.getGameId());
            userRepository.findById(friendId).ifPresent(friend -> {
                Map<String, Object> inviteEvent = Map.of(
                        "type", "GAME_INVITE",
                        "roomCode", room.getRoomCode(),
                        "gameId", room.getGameId(),
                        "gameSlug", room.getGameSlug(),
                        "fromUserId", currentUser.getId(),
                        "fromUsername", currentUser.getUsername()
                );
                messagingTemplate.convertAndSendToUser(friend.getEmail(), "/queue/game.events", inviteEvent);
            });
        }
        return ResponseEntity.ok(Map.of("invited", true));
    }

    @PostMapping("/matchmaking/join")
    public ResponseEntity<Map<String, Object>> joinMatchmaking(
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        String gameSlug = body != null ? body.get("gameSlug") : null;
        return ResponseEntity.ok(matchmakingService.joinQueue(currentUser, gameSlug));
    }

    @PostMapping("/matchmaking/cancel")
    public ResponseEntity<Map<String, Object>> cancelMatchmaking(
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        String gameSlug = body != null ? body.get("gameSlug") : null;
        matchmakingService.cancelQueue(currentUser.getId(), gameSlug);
        return ResponseEntity.ok(Map.of("cancelled", true));
    }

    @GetMapping("/{gameId}/elo-leaderboard")
    public ResponseEntity<List<UserGameRatingDto>> getEloLeaderboard(
            @PathVariable Long gameId,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(persistenceService.getEloLeaderboard(gameId, limit));
    }

    @GetMapping("/{gameId}/rating/me")
    public ResponseEntity<UserGameRatingDto> getMyRating(
            @PathVariable Long gameId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(persistenceService.getMyRating(gameId, currentUser));
    }

    @GetMapping("/{gameId}/matches/me")
    public ResponseEntity<List<GameMatchHistoryDto>> getMyMatches(
            @PathVariable Long gameId,
            @RequestParam(defaultValue = "15") int limit,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(persistenceService.getMyMatchHistory(gameId, currentUser.getId(), limit));
    }
}
