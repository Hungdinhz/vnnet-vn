package com.example.backend_java.game.engine;

import com.example.backend_java.entity.Game;
import com.example.backend_java.entity.User;
import com.example.backend_java.game.caro.CaroBotAi;
import com.example.backend_java.game.caro.CaroEngine;
import com.example.backend_java.game.caro.CaroState;
import com.example.backend_java.game.dto.*;
import com.example.backend_java.repository.GameRepository;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GameRoomManager {

    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int RECONNECT_GRACE_SECONDS = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<String, GameEngine> enginesBySlug;
    private final GameRepository gameRepository;
    private final GameMatchPersistenceService persistenceService;
    private final SimpMessagingTemplate messagingTemplate;

    private final ConcurrentHashMap<String, GameRoom> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, String> userActiveRoom = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public GameRoomManager(List<GameEngine> engines,
                           GameRepository gameRepository,
                           GameMatchPersistenceService persistenceService,
                           SimpMessagingTemplate messagingTemplate) {
        this.enginesBySlug = engines.stream().collect(Collectors.toMap(GameEngine::getGameSlug, e -> e));
        this.gameRepository = gameRepository;
        this.persistenceService = persistenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    public List<RoomStateDto> listPublicRooms(String gameSlug) {
        return rooms.values().stream()
                .filter(r -> !r.isPrivate() && !r.isVsBot() && "WAITING".equals(r.getStatus()))
                .filter(r -> gameSlug == null || gameSlug.isBlank() || gameSlug.equalsIgnoreCase(r.getGameSlug()))
                .map(this::toRoomStateDto)
                .collect(Collectors.toList());
    }

    public RoomStateDto getRoomState(String roomCode) {
        GameRoom room = requireRoom(roomCode);
        synchronized (room) {
            return toRoomStateDto(room);
        }
    }

    public RoomStateDto getActiveRoomForUser(Long userId) {
        String code = userActiveRoom.get(userId);
        if (code == null) return null;
        GameRoom room = rooms.get(code);
        if (room == null) {
            userActiveRoom.remove(userId);
            return null;
        }
        synchronized (room) {
            return toRoomStateDto(room);
        }
    }

    public RoomStateDto createRoom(User host, RoomCreateRequest req) {
        String slug = (req.getGameSlug() != null && !req.getGameSlug().isBlank()) ? req.getGameSlug() : CaroEngine.SLUG;
        GameEngine engine = enginesBySlug.get(slug);
        if (engine == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trò chơi multiplayer không được hỗ trợ: " + slug);
        }

        Game game = gameRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trò chơi"));

        // Leave previous room if user is in one
        leaveCurrentRoomIfAny(host.getId());

        String roomCode = generateRoomCode();
        int turnSeconds = req.getTurnTimeSeconds() != null ? Math.min(Math.max(req.getTurnTimeSeconds(), 15), 90) : 30;
        boolean vsBot = Boolean.TRUE.equals(req.getVsBot());
        boolean isPrivate = vsBot || Boolean.TRUE.equals(req.getIsPrivate());
        int maxPlayers = game.getMaxPlayers() != null && game.getMaxPlayers() >= 2 ? game.getMaxPlayers() : 2;
        String roomName = (req.getRoomName() != null && !req.getRoomName().isBlank())
                ? req.getRoomName().trim()
                : "Phòng của " + host.getUsername();

        GameRoom room = new GameRoom(roomCode, slug, game.getId(), roomName, isPrivate, vsBot, maxPlayers, turnSeconds, host.getId());
        if (req.getRules() != null) {
            room.getRules().putAll(req.getRules());
        }
        room.getRules().putIfAbsent("blockTwoEnds", true);

        int hostElo = persistenceService.getUserElo(host.getId(), game.getId());
        room.getPlayers().add(GameRoom.PlayerSlot.builder()
                .userId(host.getId())
                .username(host.getUsername())
                .avatarUrl(host.getAvatarUrl())
                .seatIndex(0)
                .symbol("X")
                .ready(true)
                .host(true)
                .bot(false)
                .connected(true)
                .elo(hostElo)
                .build());

        if (vsBot) {
            CaroBotAi.Difficulty botDiff = CaroBotAi.Difficulty.fromString(room.getRules().get("botDifficulty"));
            room.getRules().put("botDifficulty", botDiff.name());
            String botLabel = switch (botDiff) {
                case EASY -> "Bot AI (Dễ)";
                case HARD -> "Bot AI (Khó)";
                default -> "Bot AI (Trung bình)";
            };
            int botElo = switch (botDiff) {
                case EASY -> 800;
                case HARD -> 1400;
                default -> 1100;
            };
            room.getPlayers().add(GameRoom.PlayerSlot.builder()
                    .userId(null)
                    .username(botLabel)
                    .avatarUrl(null)
                    .seatIndex(1)
                    .symbol("O")
                    .ready(true)
                    .host(false)
                    .bot(true)
                    .connected(true)
                    .elo(botElo)
                    .build());
        }

        rooms.put(roomCode, room);
        userActiveRoom.put(host.getId(), roomCode);

        if (vsBot) {
            synchronized (room) {
                startMatchLocked(room);
            }
        } else {
            room.setSystemMessage(host.getUsername() + " đã tạo phòng. Đang chờ đối thủ...");
        }

        RoomStateDto dto = toRoomStateDto(room);
        broadcastRoom(room);
        return dto;
    }

    /**
     * Used by MatchmakingService to pair two users directly into a PLAYING room.
     */
    public RoomStateDto createMatchedRoom(String gameSlug, User player1, User player2) {
        Game game = gameRepository.findBySlug(gameSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trò chơi"));

        leaveCurrentRoomIfAny(player1.getId());
        leaveCurrentRoomIfAny(player2.getId());

        String roomCode = generateRoomCode();
        GameRoom room = new GameRoom(roomCode, gameSlug, game.getId(),
                "Đấu Rank: " + player1.getUsername() + " vs " + player2.getUsername(),
                true, false, 2, 30, player1.getId());
        room.getRules().put("blockTwoEnds", true);

        int elo1 = persistenceService.getUserElo(player1.getId(), game.getId());
        int elo2 = persistenceService.getUserElo(player2.getId(), game.getId());

        room.getPlayers().add(GameRoom.PlayerSlot.builder()
                .userId(player1.getId()).username(player1.getUsername()).avatarUrl(player1.getAvatarUrl())
                .seatIndex(0).symbol("X").ready(true).host(true).bot(false).connected(true).elo(elo1).build());
        room.getPlayers().add(GameRoom.PlayerSlot.builder()
                .userId(player2.getId()).username(player2.getUsername()).avatarUrl(player2.getAvatarUrl())
                .seatIndex(1).symbol("O").ready(true).host(false).bot(false).connected(true).elo(elo2).build());

        rooms.put(roomCode, room);
        userActiveRoom.put(player1.getId(), roomCode);
        userActiveRoom.put(player2.getId(), roomCode);

        synchronized (room) {
            startMatchLocked(room);
        }

        RoomStateDto dto = toRoomStateDto(room);
        broadcastRoom(room);
        return dto;
    }

    public RoomStateDto joinRoom(User user, String rawRoomCode) {
        String roomCode = rawRoomCode != null ? rawRoomCode.trim().toUpperCase() : "";
        GameRoom room = requireRoom(roomCode);

        synchronized (room) {
            // Reconnect / already in room
            Optional<GameRoom.PlayerSlot> existing = room.findPlayerByUserId(user.getId());
            if (existing.isPresent()) {
                GameRoom.PlayerSlot slot = existing.get();
                slot.setConnected(true);
                if (user.getId().equals(room.getDisconnectedUserId())) {
                    room.setDisconnectedUserId(null);
                    room.setReconnectDeadlineEpochMs(null);
                    if (room.getReconnectTimerFuture() != null) {
                        room.getReconnectTimerFuture().cancel(false);
                        room.setReconnectTimerFuture(null);
                    }
                    room.setSystemMessage(user.getUsername() + " đã kết nối lại trận đấu!");
                }
                userActiveRoom.put(user.getId(), roomCode);
                broadcastRoom(room);
                return toRoomStateDto(room);
            }

            if (!"WAITING".equals(room.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phòng đang diễn ra trận đấu hoặc đã kết thúc");
            }
            if (room.getPlayers().size() >= room.getMaxPlayers()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phòng đã đủ người chơi");
            }

            leaveCurrentRoomIfAny(user.getId());

            int nextSeat = findNextAvailableSeat(room);
            int elo = persistenceService.getUserElo(user.getId(), room.getGameId());
            room.getPlayers().add(GameRoom.PlayerSlot.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .avatarUrl(user.getAvatarUrl())
                    .seatIndex(nextSeat)
                    .symbol(nextSeat == 0 ? "X" : "O")
                    .ready(false)
                    .host(false)
                    .bot(false)
                    .connected(true)
                    .elo(elo)
                    .build());

            userActiveRoom.put(user.getId(), roomCode);
            room.setSystemMessage(user.getUsername() + " đã tham gia phòng!");
            broadcastRoom(room);
            return toRoomStateDto(room);
        }
    }

    public void toggleReady(User user, String roomCode) {
        GameRoom room = requireRoom(roomCode);
        synchronized (room) {
            if (!"WAITING".equals(room.getStatus())) return;
            GameRoom.PlayerSlot slot = room.findPlayerByUserId(user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không ở trong phòng này"));
            slot.setReady(!slot.isReady());
            room.setSystemMessage(user.getUsername() + (slot.isReady() ? " đã sẵn sàng!" : " đã hủy sẵn sàng."));

            // Auto-start when room is full and everyone is ready
            if (room.getPlayers().size() == room.getMaxPlayers()
                    && room.getPlayers().stream().allMatch(GameRoom.PlayerSlot::isReady)) {
                startMatchLocked(room);
            }
            broadcastRoom(room);
        }
    }

    public void startRoom(User user, String roomCode) {
        GameRoom room = requireRoom(roomCode);
        synchronized (room) {
            if (!user.getId().equals(room.getHostUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ phòng mới có thể bắt đầu trận đấu");
            }
            if (!"WAITING".equals(room.getStatus())) return;
            if (room.getPlayers().size() < 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần đủ 2 người chơi để bắt đầu");
            }
            startMatchLocked(room);
            broadcastRoom(room);
        }
    }

    public void handleAction(User user, GameActionRequest request) {
        GameRoom room = requireRoom(request.getRoomCode());
        synchronized (room) {
            GameRoom.PlayerSlot actor = room.findPlayerByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Bạn không phải người chơi trong phòng này"));

            String type = request.getType() != null ? request.getType().toUpperCase() : "";

            // Rematch handling in FINISHED state
            if ("REMATCH".equals(type)) {
                handleRematchLocked(room, actor);
                return;
            }

            if (!"PLAYING".equals(room.getStatus())) {
                throw new IllegalArgumentException("Trận đấu không ở trạng thái đang chơi");
            }

            GameEngine engine = enginesBySlug.get(room.getGameSlug());
            GameEngine.ActionResult result = engine.handleAction(room, actor, request);
            processActionResultLocked(room, engine, result);
        }
    }

    private void handleRematchLocked(GameRoom room, GameRoom.PlayerSlot actor) {
        if (!"FINISHED".equals(room.getStatus())) return;
        actor.setWantsRematch(true);
        room.setSystemMessage(actor.getUsername() + " muốn tái đấu!");

        boolean allHumansWantRematch = room.getPlayers().stream()
                .filter(p -> !p.isBot())
                .allMatch(GameRoom.PlayerSlot::isWantsRematch);

        if (allHumansWantRematch) {
            // Swap X/O seats so the second player gets to go first in the rematch
            if (room.getPlayers().size() == 2 && !room.isVsBot()) {
                for (GameRoom.PlayerSlot p : room.getPlayers()) {
                    int newSeat = p.getSeatIndex() == 0 ? 1 : 0;
                    p.setSeatIndex(newSeat);
                    p.setSymbol(newSeat == 0 ? "X" : "O");
                }
                room.getPlayers().sort(Comparator.comparingInt(GameRoom.PlayerSlot::getSeatIndex));
            }
            startMatchLocked(room);
        }
        broadcastRoom(room);
    }

    public void sendChat(User user, String roomCode, String content, String type) {
        if (content == null || content.trim().isEmpty()) return;
        GameRoom room = requireRoom(roomCode);
        String safeContent = content.trim();
        if (safeContent.length() > 200) {
            safeContent = safeContent.substring(0, 200);
        }
        synchronized (room) {
            if (room.findPlayerByUserId(user.getId()).isEmpty()) return;
            RoomChatMessageDto msg = RoomChatMessageDto.builder()
                    .id(UUID.randomUUID().toString())
                    .roomCode(room.getRoomCode())
                    .senderId(user.getId())
                    .senderName(user.getUsername())
                    .senderAvatar(user.getAvatarUrl())
                    .content(safeContent)
                    .type("EMOJI".equalsIgnoreCase(type) ? "EMOJI" : "CHAT")
                    .timestamp(System.currentTimeMillis())
                    .build();
            room.addChatMessage(msg);
            messagingTemplate.convertAndSend("/topic/game.room." + room.getRoomCode() + ".chat", msg);
        }
    }

    public void leaveRoom(Long userId, String roomCode) {
        GameRoom room = rooms.get(roomCode != null ? roomCode.trim().toUpperCase() : "");
        if (room == null) return;

        synchronized (room) {
            Optional<GameRoom.PlayerSlot> slotOpt = room.findPlayerByUserId(userId);
            if (slotOpt.isEmpty()) return;
            GameRoom.PlayerSlot leaver = slotOpt.get();
            userActiveRoom.remove(userId, room.getRoomCode());

            if ("PLAYING".equals(room.getStatus())) {
                // Leaving mid-game counts as forfeit
                int winnerSeat = leaver.getSeatIndex() == 0 ? 1 : 0;
                finishMatchLocked(room, winnerSeat, "FORFEIT",
                        leaver.getUsername() + " đã rời phòng (xử thua cuộc).");
                broadcastRoom(room);
                return;
            }

            room.getPlayers().remove(leaver);
            boolean hasHuman = room.getPlayers().stream().anyMatch(p -> !p.isBot());
            if (!hasHuman) {
                room.cancelTimers();
                rooms.remove(room.getRoomCode());
                return;
            }

            // Promote remaining human to host
            if (userId.equals(room.getHostUserId())) {
                room.getPlayers().stream().filter(p -> !p.isBot()).findFirst().ifPresent(newHost -> {
                    newHost.setHost(true);
                    newHost.setReady(true);
                    room.setHostUserId(newHost.getUserId());
                });
            }
            room.setSystemMessage(leaver.getUsername() + " đã rời phòng.");
            broadcastRoom(room);
        }
    }

    public void handleUserDisconnect(Long userId) {
        String code = userActiveRoom.get(userId);
        if (code == null) return;
        GameRoom room = rooms.get(code);
        if (room == null) return;

        synchronized (room) {
            Optional<GameRoom.PlayerSlot> slotOpt = room.findPlayerByUserId(userId);
            if (slotOpt.isEmpty()) return;
            GameRoom.PlayerSlot slot = slotOpt.get();
            slot.setConnected(false);

            if (!"PLAYING".equals(room.getStatus())) {
                // In WAITING or FINISHED, wait 15s then clean up if still disconnected
                scheduler.schedule(() -> {
                    synchronized (room) {
                        if (!slot.isConnected() && !"PLAYING".equals(room.getStatus())) {
                            leaveRoom(userId, room.getRoomCode());
                        }
                    }
                }, 15, TimeUnit.SECONDS);
                broadcastRoom(room);
                return;
            }

            // In PLAYING state: 30s reconnect grace period
            room.setDisconnectedUserId(userId);
            room.setReconnectDeadlineEpochMs(System.currentTimeMillis() + RECONNECT_GRACE_SECONDS * 1000L);
            room.setSystemMessage(slot.getUsername() + " mất kết nối! Chờ kết nối lại trong " + RECONNECT_GRACE_SECONDS + " giây...");

            if (room.getReconnectTimerFuture() != null) {
                room.getReconnectTimerFuture().cancel(false);
            }
            room.setReconnectTimerFuture(scheduler.schedule(() -> {
                synchronized (room) {
                    if (!slot.isConnected() && "PLAYING".equals(room.getStatus())) {
                        int winnerSeat = slot.getSeatIndex() == 0 ? 1 : 0;
                        finishMatchLocked(room, winnerSeat, "DISCONNECT",
                                slot.getUsername() + " không kết nối lại sau 30 giây (xử thua).");
                        broadcastRoom(room);
                    }
                }
            }, RECONNECT_GRACE_SECONDS, TimeUnit.SECONDS));

            broadcastRoom(room);
        }
    }

    private void startMatchLocked(GameRoom room) {
        room.cancelTimers();
        GameEngine engine = enginesBySlug.get(room.getGameSlug());
        room.setGameState(engine.initState(room));
        room.setStatus("PLAYING");
        room.setStartedAtEpochMs(System.currentTimeMillis());
        room.setWinnerSeat(null);
        room.setWinnerUserId(null);
        room.setEndReason(null);
        room.setDisconnectedUserId(null);
        room.setReconnectDeadlineEpochMs(null);
        for (GameRoom.PlayerSlot p : room.getPlayers()) {
            p.setWantsRematch(false);
            p.setEloDelta(null);
        }
        room.setSystemMessage("Trận đấu bắt đầu! Quân X đi trước.");
        scheduleTurnTimerLocked(room);
    }

    private void processActionResultLocked(GameRoom room, GameEngine engine, GameEngine.ActionResult result) {
        if (result.matchFinished()) {
            String msg = switch (result.endReason() != null ? result.endReason() : "") {
                case "FIVE_IN_ROW" -> "Chiến thắng thuyết phục với 5 quân liên tiếp!";
                case "TIMEOUT" -> "Hết thời gian suy nghĩ!";
                case "FORFEIT" -> "Đối thủ đã đầu hàng!";
                case "DRAW" -> "Trận đấu kết thúc với tỉ số HÒA!";
                default -> "Trận đấu đã kết thúc!";
            };
            finishMatchLocked(room, result.winnerSeat(), result.endReason(), msg);
            broadcastRoom(room);
            return;
        }

        if (result.resetTurnTimer()) {
            scheduleTurnTimerLocked(room);
        }
        broadcastRoom(room);

        if (result.triggerBotTurn()) {
            scheduleBotMoveLocked(room);
        }
    }

    private void scheduleTurnTimerLocked(GameRoom room) {
        if (room.getTurnTimerFuture() != null) {
            room.getTurnTimerFuture().cancel(false);
        }
        long deadline = System.currentTimeMillis() + room.getTurnTimeSeconds() * 1000L;
        room.setTurnDeadlineEpochMs(deadline);

        room.setTurnTimerFuture(scheduler.schedule(() -> {
            synchronized (room) {
                if (!"PLAYING".equals(room.getStatus())) return;
                GameEngine engine = enginesBySlug.get(room.getGameSlug());
                GameEngine.ActionResult timeoutResult = engine.handleTurnTimeout(room);
                if (timeoutResult.matchFinished()) {
                    finishMatchLocked(room, timeoutResult.winnerSeat(), timeoutResult.endReason(),
                            "Hết giờ suy nghĩ! Xử thắng cho đối thủ.");
                    broadcastRoom(room);
                }
            }
        }, room.getTurnTimeSeconds(), TimeUnit.SECONDS));
    }

    private void scheduleBotMoveLocked(GameRoom room) {
        if (room.getBotMoveFuture() != null) {
            room.getBotMoveFuture().cancel(false);
        }
        room.setBotMoveFuture(scheduler.schedule(() -> {
            synchronized (room) {
                if (!"PLAYING".equals(room.getStatus())) return;
                if (!CaroEngine.SLUG.equals(room.getGameSlug())) return;
                CaroState state = (CaroState) room.getGameState();
                int botSeat = state.getCurrentTurnSeat();
                Optional<GameRoom.PlayerSlot> botSlot = room.findPlayerBySeat(botSeat).filter(GameRoom.PlayerSlot::isBot);
                if (botSlot.isEmpty()) return;

                int botPiece = state.pieceForSeat(botSeat);
                int humanPiece = state.pieceForSeat(botSeat == 0 ? 1 : 0);
                CaroBotAi.Difficulty botDiff = CaroBotAi.Difficulty.fromString(room.getRules().get("botDifficulty"));
                int[] move = CaroBotAi.chooseBestMove(state.getBoard(), botPiece, humanPiece, state.isBlockTwoEnds(), botDiff);
                if (move == null) return;

                CaroEngine caroEngine = (CaroEngine) enginesBySlug.get(CaroEngine.SLUG);
                GameEngine.ActionResult res = caroEngine.applyMove(room, state, botSeat, move[0], move[1]);
                processActionResultLocked(room, caroEngine, res);
            }
        }, 450, TimeUnit.MILLISECONDS));
    }

    private void finishMatchLocked(GameRoom room, Integer winnerSeat, String endReason, String message) {
        room.cancelTimers();
        room.setStatus("FINISHED");
        room.setTurnDeadlineEpochMs(null);
        room.setReconnectDeadlineEpochMs(null);
        room.setDisconnectedUserId(null);
        room.setWinnerSeat(winnerSeat);
        room.setEndReason(endReason);
        room.setSystemMessage(message);

        Long winnerUserId = null;
        if (winnerSeat != null) {
            winnerUserId = room.findPlayerBySeat(winnerSeat)
                    .filter(p -> !p.isBot())
                    .map(GameRoom.PlayerSlot::getUserId)
                    .orElse(null);
        }
        room.setWinnerUserId(winnerUserId);

        GameEngine engine = enginesBySlug.get(room.getGameSlug());
        int totalMoves = engine != null ? engine.getTotalMoves(room) : 0;

        try {
            persistenceService.recordFinishedMatch(room, winnerSeat, endReason, totalMoves);
        } catch (Exception e) {
            log.error("Failed to persist match result for room {}: {}", room.getRoomCode(), e.getMessage(), e);
        }
    }

    private void leaveCurrentRoomIfAny(Long userId) {
        String existingCode = userActiveRoom.get(userId);
        if (existingCode != null) {
            leaveRoom(userId, existingCode);
        }
    }

    private GameRoom requireRoom(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã phòng không hợp lệ");
        }
        GameRoom room = rooms.get(roomCode.trim().toUpperCase());
        if (room == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng chơi: " + roomCode);
        }
        return room;
    }

    private int findNextAvailableSeat(GameRoom room) {
        Set<Integer> used = room.getPlayers().stream().map(GameRoom.PlayerSlot::getSeatIndex).collect(Collectors.toSet());
        for (int i = 0; i < room.getMaxPlayers(); i++) {
            if (!used.contains(i)) return i;
        }
        return room.getPlayers().size();
    }

    private String generateRoomCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(ROOM_CODE_CHARS.charAt(RANDOM.nextInt(ROOM_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!rooms.containsKey(code)) return code;
        }
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private void broadcastRoom(GameRoom room) {
        RoomStateDto dto = toRoomStateDto(room);
        messagingTemplate.convertAndSend("/topic/game.room." + room.getRoomCode(), dto);
    }

    public RoomStateDto toRoomStateDto(GameRoom room) {
        GameEngine engine = enginesBySlug.get(room.getGameSlug());
        Map<String, Object> serializedState = (engine != null && room.getGameState() != null)
                ? engine.serializeState(room)
                : Map.of();

        return RoomStateDto.builder()
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .gameSlug(room.getGameSlug())
                .gameId(room.getGameId())
                .status(room.getStatus())
                .isPrivate(room.isPrivate())
                .vsBot(room.isVsBot())
                .maxPlayers(room.getMaxPlayers())
                .turnTimeSeconds(room.getTurnTimeSeconds())
                .turnDeadlineEpochMs(room.getTurnDeadlineEpochMs())
                .reconnectDeadlineEpochMs(room.getReconnectDeadlineEpochMs())
                .disconnectedUserId(room.getDisconnectedUserId())
                .hostUserId(room.getHostUserId())
                .rules(new HashMap<>(room.getRules()))
                .players(room.getPlayers().stream().map(GameRoom.PlayerSlot::toDto).collect(Collectors.toList()))
                .gameState(serializedState)
                .winnerUserId(room.getWinnerUserId())
                .winnerSeat(room.getWinnerSeat())
                .endReason(room.getEndReason())
                .systemMessage(room.getSystemMessage())
                .recentChat(new ArrayList<>(room.getRecentChat()))
                .build();
    }
}
