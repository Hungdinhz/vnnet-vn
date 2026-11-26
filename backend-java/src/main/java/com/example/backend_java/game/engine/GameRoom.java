package com.example.backend_java.game.engine;

import com.example.backend_java.game.dto.RoomChatMessageDto;
import com.example.backend_java.game.dto.RoomPlayerDto;
import lombok.Builder;
import lombok.Data;

import java.util.*;
import java.util.concurrent.ScheduledFuture;

@Data
public class GameRoom {

    private final String roomCode;
    private final String gameSlug;
    private final Long gameId;
    private String roomName;
    private boolean isPrivate;
    private boolean vsBot;
    private int maxPlayers;
    private int turnTimeSeconds;
    private Long hostUserId;
    private String status = "WAITING"; // WAITING, PLAYING, FINISHED
    private Map<String, Object> rules = new HashMap<>();

    private final List<PlayerSlot> players = new ArrayList<>();
    private final LinkedList<RoomChatMessageDto> recentChat = new LinkedList<>();

    private Object gameState;
    private Long startedAtEpochMs;
    private Long turnDeadlineEpochMs;
    private Long reconnectDeadlineEpochMs;
    private Long disconnectedUserId;

    private Long winnerUserId;
    private Integer winnerSeat;
    private String endReason;
    private String systemMessage;

    private transient ScheduledFuture<?> turnTimerFuture;
    private transient ScheduledFuture<?> reconnectTimerFuture;
    private transient ScheduledFuture<?> botMoveFuture;

    public GameRoom(String roomCode, String gameSlug, Long gameId, String roomName,
                    boolean isPrivate, boolean vsBot, int maxPlayers, int turnTimeSeconds, Long hostUserId) {
        this.roomCode = roomCode;
        this.gameSlug = gameSlug;
        this.gameId = gameId;
        this.roomName = roomName;
        this.isPrivate = isPrivate;
        this.vsBot = vsBot;
        this.maxPlayers = maxPlayers;
        this.turnTimeSeconds = turnTimeSeconds;
        this.hostUserId = hostUserId;
    }

    public void addChatMessage(RoomChatMessageDto msg) {
        recentChat.addLast(msg);
        while (recentChat.size() > 50) {
            recentChat.removeFirst();
        }
    }

    public Optional<PlayerSlot> findPlayerByUserId(Long userId) {
        if (userId == null) return Optional.empty();
        return players.stream().filter(p -> !p.isBot() && userId.equals(p.getUserId())).findFirst();
    }

    public Optional<PlayerSlot> findPlayerBySeat(int seatIndex) {
        return players.stream().filter(p -> p.getSeatIndex() == seatIndex).findFirst();
    }

    public void cancelTimers() {
        if (turnTimerFuture != null) {
            turnTimerFuture.cancel(false);
            turnTimerFuture = null;
        }
        if (reconnectTimerFuture != null) {
            reconnectTimerFuture.cancel(false);
            reconnectTimerFuture = null;
        }
        if (botMoveFuture != null) {
            botMoveFuture.cancel(false);
            botMoveFuture = null;
        }
    }

    @Data
    @Builder
    public static class PlayerSlot {
        private Long userId;
        private String username;
        private String avatarUrl;
        private int seatIndex;
        private String symbol;
        private boolean ready;
        private boolean host;
        private boolean bot;
        private boolean connected;
        private int elo;
        private Integer eloDelta;
        private boolean wantsRematch;

        public RoomPlayerDto toDto() {
            return RoomPlayerDto.builder()
                    .userId(userId)
                    .username(username)
                    .avatarUrl(avatarUrl)
                    .seatIndex(seatIndex)
                    .symbol(symbol)
                    .ready(ready)
                    .host(host)
                    .bot(bot)
                    .connected(connected)
                    .elo(elo)
                    .eloDelta(eloDelta)
                    .wantsRematch(wantsRematch)
                    .build();
        }
    }
}
