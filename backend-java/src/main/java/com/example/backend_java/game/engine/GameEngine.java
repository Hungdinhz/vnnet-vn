package com.example.backend_java.game.engine;

import com.example.backend_java.game.dto.GameActionRequest;

import java.util.Map;

/**
 * Strategy interface for server-authoritative multiplayer games.
 * Adding a new multiplayer game (e.g. Draw & Guess, Word Chain) only requires implementing this interface.
 */
public interface GameEngine {

    String getGameSlug();

    Object initState(GameRoom room);

    /**
     * Validate and apply a player action. Throws IllegalArgumentException if invalid.
     *
     * @return ActionResult describing whether the turn changed or the match ended.
     */
    ActionResult handleAction(GameRoom room, GameRoom.PlayerSlot actor, GameActionRequest request);

    /**
     * Handle turn timeout on the server.
     */
    ActionResult handleTurnTimeout(GameRoom room);

    /**
     * Serialize current game state into a clean map for broadcasting to clients.
     */
    Map<String, Object> serializeState(GameRoom room);

    /**
     * Return total move count for match history metadata.
     */
    int getTotalMoves(GameRoom room);

    record ActionResult(
            boolean matchFinished,
            Integer winnerSeat, // null if draw or not finished
            String endReason,
            boolean resetTurnTimer,
            boolean triggerBotTurn
    ) {
        public static ActionResult ongoing(boolean resetTurnTimer, boolean triggerBotTurn) {
            return new ActionResult(false, null, null, resetTurnTimer, triggerBotTurn);
        }

        public static ActionResult finished(Integer winnerSeat, String endReason) {
            return new ActionResult(true, winnerSeat, endReason, false, false);
        }
    }
}
