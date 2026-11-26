package com.example.backend_java.game;

import com.example.backend_java.game.caro.CaroBotAi;
import com.example.backend_java.game.caro.CaroEngine;
import com.example.backend_java.game.caro.CaroState;
import com.example.backend_java.game.dto.GameActionRequest;
import com.example.backend_java.game.engine.GameEngine;
import com.example.backend_java.game.engine.GameRoom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CaroEngineTest {

    private CaroEngine engine;
    private GameRoom room;
    private GameRoom.PlayerSlot playerX;
    private GameRoom.PlayerSlot playerO;

    @BeforeEach
    void setUp() {
        engine = new CaroEngine();
        room = new GameRoom("TEST01", CaroEngine.SLUG, 1L, "Test Room", false, false, 2, 30, 100L);
        room.getRules().put("blockTwoEnds", true);
        playerX = GameRoom.PlayerSlot.builder().userId(100L).username("Alice").seatIndex(0).symbol("X").ready(true).host(true).connected(true).elo(1000).build();
        playerO = GameRoom.PlayerSlot.builder().userId(200L).username("Bob").seatIndex(1).symbol("O").ready(true).host(false).connected(true).elo(1000).build();
        room.getPlayers().add(playerX);
        room.getPlayers().add(playerO);
        room.setGameState(engine.initState(room));
        room.setStatus("PLAYING");
    }

    @Test
    void testHorizontalWinFiveInRow() {
        CaroState state = (CaroState) room.getGameState();
        // X plays (7,3), (7,4), (7,5), (7,6), (7,7); O plays row 8
        for (int i = 0; i < 4; i++) {
            GameEngine.ActionResult resX = engine.handleAction(room, playerX, move(7, 3 + i));
            assertFalse(resX.matchFinished());
            GameEngine.ActionResult resO = engine.handleAction(room, playerO, move(8, 3 + i));
            assertFalse(resO.matchFinished());
        }
        GameEngine.ActionResult win = engine.handleAction(room, playerX, move(7, 7));
        assertTrue(win.matchFinished());
        assertEquals(0, win.winnerSeat());
        assertEquals("FIVE_IN_ROW", win.endReason());
        assertEquals(5, state.getWinningCells().size());
    }

    @Test
    void testDiagonalWinFiveInRow() {
        for (int i = 0; i < 4; i++) {
            engine.handleAction(room, playerX, move(2 + i, 2 + i));
            engine.handleAction(room, playerO, move(0, i));
        }
        GameEngine.ActionResult win = engine.handleAction(room, playerX, move(6, 6));
        assertTrue(win.matchFinished());
        assertEquals(0, win.winnerSeat());
    }

    @Test
    void testBlockTwoEndsRulePreventsWin() {
        CaroState state = (CaroState) room.getGameState();
        int[][] board = state.getBoard();
        // O blocks both ends at (5,2) and (5,8); X has 4 in between at (5,3..6)
        board[5][2] = CaroState.SEAT_O;
        board[5][8] = CaroState.SEAT_O;
        board[5][3] = CaroState.SEAT_X;
        board[5][4] = CaroState.SEAT_X;
        board[5][5] = CaroState.SEAT_X;
        board[5][6] = CaroState.SEAT_X;

        // X places 5th at (5,7) -> blocked on both ends -> NOT a win when blockTwoEnds = true
        board[5][7] = CaroState.SEAT_X;
        List<int[]> winBlocked = engine.findWinningLine(board, 5, 7, CaroState.SEAT_X, true);
        assertTrue(winBlocked.isEmpty(), "5 quân bị chặn 2 đầu không được tính thắng khi bật luật chặn 2 đầu");

        // Same board with blockTwoEnds = false -> IS a win
        List<int[]> winFree = engine.findWinningLine(board, 5, 7, CaroState.SEAT_X, false);
        assertEquals(5, winFree.size());
    }

    @Test
    void testRejectWrongTurnAndOccupiedCell() {
        assertThrows(IllegalArgumentException.class, () -> engine.handleAction(room, playerO, move(7, 7)));
        engine.handleAction(room, playerX, move(7, 7));
        assertThrows(IllegalArgumentException.class, () -> engine.handleAction(room, playerO, move(7, 7)));
        assertThrows(IllegalArgumentException.class, () -> engine.handleAction(room, playerO, move(-1, 0)));
    }

    @Test
    void testBotAiBlocksImmediateFourInRow() {
        int[][] board = new int[CaroState.BOARD_SIZE][CaroState.BOARD_SIZE];
        // Human X has 4 in a row at (7,5..8)
        board[7][5] = CaroState.SEAT_X;
        board[7][6] = CaroState.SEAT_X;
        board[7][7] = CaroState.SEAT_X;
        board[7][8] = CaroState.SEAT_X;

        int[] botMove = CaroBotAi.chooseBestMove(board, CaroState.SEAT_O, CaroState.SEAT_X, true);
        assertNotNull(botMove);
        assertEquals(7, botMove[0]);
        assertTrue(botMove[1] == 4 || botMove[1] == 9, "Bot phải chặn đầu (7,4) hoặc (7,9)");
    }

    private GameActionRequest move(int row, int col) {
        return GameActionRequest.builder()
                .roomCode("TEST01")
                .type("MOVE")
                .payload(Map.of("row", row, "col", col))
                .build();
    }
}
