package com.example.backend_java.game.caro;

import com.example.backend_java.game.dto.GameActionRequest;
import com.example.backend_java.game.engine.GameEngine;
import com.example.backend_java.game.engine.GameRoom;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CaroEngine implements GameEngine {

    public static final String SLUG = "caro-online";
    private static final int[][] DIRS = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};

    @Override
    public String getGameSlug() {
        return SLUG;
    }

    @Override
    public Object initState(GameRoom room) {
        boolean blockTwoEnds = true;
        if (room.getRules() != null && room.getRules().containsKey("blockTwoEnds")) {
            Object val = room.getRules().get("blockTwoEnds");
            if (val instanceof Boolean b) {
                blockTwoEnds = b;
            }
        }
        return new CaroState(blockTwoEnds);
    }

    @Override
    public ActionResult handleAction(GameRoom room, GameRoom.PlayerSlot actor, GameActionRequest request) {
        CaroState state = (CaroState) room.getGameState();
        if (state == null) {
            throw new IllegalArgumentException("Trạng thái bàn cờ chưa được khởi tạo");
        }
        if (!"PLAYING".equals(room.getStatus())) {
            throw new IllegalArgumentException("Trận đấu chưa bắt đầu hoặc đã kết thúc");
        }

        String type = request.getType() != null ? request.getType().toUpperCase() : "";

        if ("RESIGN".equals(type)) {
            int opponentSeat = actor.getSeatIndex() == 0 ? 1 : 0;
            state.setWinnerSeat(opponentSeat);
            state.setEndReason("FORFEIT");
            return ActionResult.finished(opponentSeat, "FORFEIT");
        }

        if (!"MOVE".equals(type)) {
            throw new IllegalArgumentException("Hành động không hợp lệ: " + type);
        }

        if (actor.getSeatIndex() != state.getCurrentTurnSeat()) {
            throw new IllegalArgumentException("Chưa đến lượt của bạn");
        }

        Map<String, Object> payload = request.getPayload();
        if (payload == null || !payload.containsKey("row") || !payload.containsKey("col")) {
            throw new IllegalArgumentException("Thiếu tọa độ nước đi (row, col)");
        }

        int row = ((Number) payload.get("row")).intValue();
        int col = ((Number) payload.get("col")).intValue();

        return applyMove(room, state, actor.getSeatIndex(), row, col);
    }

    public ActionResult applyMove(GameRoom room, CaroState state, int seatIndex, int row, int col) {
        if (row < 0 || row >= CaroState.BOARD_SIZE || col < 0 || col >= CaroState.BOARD_SIZE) {
            throw new IllegalArgumentException("Tọa độ nước đi nằm ngoài bàn cờ 15×15");
        }
        if (state.getBoard()[row][col] != CaroState.EMPTY) {
            throw new IllegalArgumentException("Ô này đã có quân cờ");
        }

        int piece = state.pieceForSeat(seatIndex);
        state.getBoard()[row][col] = piece;
        state.setLastMove(new int[]{row, col});
        state.setMoveCount(state.getMoveCount() + 1);

        // Check win
        List<int[]> winLine = findWinningLine(state.getBoard(), row, col, piece, state.isBlockTwoEnds());
        if (!winLine.isEmpty()) {
            state.setWinningCells(winLine);
            state.setWinnerSeat(seatIndex);
            state.setEndReason("FIVE_IN_ROW");
            return ActionResult.finished(seatIndex, "FIVE_IN_ROW");
        }

        // Check draw
        if (state.getMoveCount() >= CaroState.BOARD_SIZE * CaroState.BOARD_SIZE) {
            state.setWinnerSeat(null);
            state.setEndReason("DRAW");
            return ActionResult.finished(null, "DRAW");
        }

        // Switch turn
        int nextSeat = seatIndex == 0 ? 1 : 0;
        state.setCurrentTurnSeat(nextSeat);

        boolean nextIsBot = room.findPlayerBySeat(nextSeat)
                .map(GameRoom.PlayerSlot::isBot)
                .orElse(false);

        return ActionResult.ongoing(true, nextIsBot);
    }

    @Override
    public ActionResult handleTurnTimeout(GameRoom room) {
        CaroState state = (CaroState) room.getGameState();
        if (state == null || !"PLAYING".equals(room.getStatus())) {
            return ActionResult.ongoing(false, false);
        }
        int winnerSeat = state.getCurrentTurnSeat() == 0 ? 1 : 0;
        state.setWinnerSeat(winnerSeat);
        state.setEndReason("TIMEOUT");
        return ActionResult.finished(winnerSeat, "TIMEOUT");
    }

    @Override
    public Map<String, Object> serializeState(GameRoom room) {
        CaroState state = (CaroState) room.getGameState();
        if (state == null) {
            return Map.of();
        }
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("boardSize", CaroState.BOARD_SIZE);
        map.put("board", state.getBoard());
        map.put("currentTurnSeat", state.getCurrentTurnSeat());
        map.put("blockTwoEnds", state.isBlockTwoEnds());
        map.put("moveCount", state.getMoveCount());
        map.put("lastMove", state.getLastMove());
        map.put("winningCells", state.getWinningCells());
        return map;
    }

    @Override
    public int getTotalMoves(GameRoom room) {
        CaroState state = (CaroState) room.getGameState();
        return state != null ? state.getMoveCount() : 0;
    }

    /**
     * Checks 4 directions from (row, col) for >= 5 consecutive pieces.
     * If blockTwoEnds == true, a line of 5 blocked on BOTH ends by opponent's pieces does NOT win.
     */
    public List<int[]> findWinningLine(int[][] board, int row, int col, int piece, boolean blockTwoEnds) {
        int opp = piece == CaroState.SEAT_X ? CaroState.SEAT_O : CaroState.SEAT_X;
        int size = board.length;

        for (int[] dir : DIRS) {
            List<int[]> line = new ArrayList<>();
            line.add(new int[]{row, col});

            // Forward
            int r = row + dir[0];
            int c = col + dir[1];
            while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == piece) {
                line.add(new int[]{r, c});
                r += dir[0];
                c += dir[1];
            }
            boolean blockedForward = (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == opp);

            // Backward
            r = row - dir[0];
            c = col - dir[1];
            while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == piece) {
                line.add(0, new int[]{r, c});
                r -= dir[0];
                c -= dir[1];
            }
            boolean blockedBackward = (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == opp);

            if (line.size() >= 5) {
                if (!blockTwoEnds || !(blockedForward && blockedBackward)) {
                    return line;
                }
            }
        }
        return Collections.emptyList();
    }
}
