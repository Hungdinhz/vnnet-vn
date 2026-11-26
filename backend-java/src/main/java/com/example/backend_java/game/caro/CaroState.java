package com.example.backend_java.game.caro;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CaroState {
    public static final int BOARD_SIZE = 15;
    public static final int EMPTY = 0;
    public static final int SEAT_X = 1; // seatIndex 0 -> X (1)
    public static final int SEAT_O = 2; // seatIndex 1 -> O (2)

    private int[][] board = new int[BOARD_SIZE][BOARD_SIZE];
    private int currentTurnSeat = 0; // 0 = X, 1 = O
    private boolean blockTwoEnds = true; // Vietnamese Caro rule: 5 blocked on both ends is not a win
    private int moveCount = 0;
    private int[] lastMove = null; // [row, col]
    private List<int[]> winningCells = new ArrayList<>();
    private Integer winnerSeat = null;
    private String endReason = null;

    public CaroState(boolean blockTwoEnds) {
        this.blockTwoEnds = blockTwoEnds;
    }

    public int pieceForSeat(int seatIndex) {
        return seatIndex == 0 ? SEAT_X : SEAT_O;
    }
}
