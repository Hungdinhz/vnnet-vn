package com.example.backend_java.game.caro;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Fast, tactical heuristic Bot AI for 15x15 Caro (Gomoku).
 * Evaluates attack & defense patterns around occupied cells in < 5ms.
 */
public final class CaroBotAi {

    private static final int[][] DIRS = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};
    private static final Random RANDOM = new Random();

    private CaroBotAi() {}

    public static int[] chooseBestMove(int[][] board, int botPiece, int humanPiece, boolean blockTwoEnds) {
        int size = board.length;
        int center = size / 2;

        // First move: play center or adjacent to center
        boolean anyPiece = false;
        for (int r = 0; r < size && !anyPiece; r++) {
            for (int c = 0; c < size; c++) {
                if (board[r][c] != CaroState.EMPTY) {
                    anyPiece = true;
                    break;
                }
            }
        }
        if (!anyPiece) {
            return new int[]{center, center};
        }

        // Collect candidate cells within distance 2 of any existing stone
        List<int[]> candidates = new ArrayList<>();
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (board[r][c] == CaroState.EMPTY && hasNeighbor(board, r, c, 2)) {
                    candidates.add(new int[]{r, c});
                }
            }
        }
        if (candidates.isEmpty()) {
            for (int r = 0; r < size; r++) {
                for (int c = 0; c < size; c++) {
                    if (board[r][c] == CaroState.EMPTY) {
                        return new int[]{r, c};
                    }
                }
            }
            return null;
        }

        long bestScore = Long.MIN_VALUE;
        List<int[]> bestMoves = new ArrayList<>();

        for (int[] cell : candidates) {
            int r = cell[0];
            int c = cell[1];

            // 1. Immediate win check
            board[r][c] = botPiece;
            if (isWinningMove(board, r, c, botPiece, blockTwoEnds)) {
                board[r][c] = CaroState.EMPTY;
                return new int[]{r, c};
            }
            board[r][c] = CaroState.EMPTY;

            // 2. Evaluate attack + defense
            long attack = evaluateCell(board, r, c, botPiece, humanPiece);
            long defense = evaluateCell(board, r, c, humanPiece, botPiece);
            // Slightly prioritize blocking opponent's lethal 4 / open 3 while staying aggressive
            long centerBias = 14 - (Math.abs(r - center) + Math.abs(c - center));
            long total = attack + (long) (defense * 1.15) + centerBias;

            if (total > bestScore) {
                bestScore = total;
                bestMoves.clear();
                bestMoves.add(cell);
            } else if (total == bestScore) {
                bestMoves.add(cell);
            }
        }

        return bestMoves.get(RANDOM.nextInt(bestMoves.size()));
    }

    private static boolean hasNeighbor(int[][] board, int r, int c, int radius) {
        int size = board.length;
        int rMin = Math.max(0, r - radius);
        int rMax = Math.min(size - 1, r + radius);
        int cMin = Math.max(0, c - radius);
        int cMax = Math.min(size - 1, c + radius);
        for (int i = rMin; i <= rMax; i++) {
            for (int j = cMin; j <= cMax; j++) {
                if (board[i][j] != CaroState.EMPTY) {
                    return true;
                }
            }
        }
        return false;
    }

    private static long evaluateCell(int[][] board, int r, int c, int myPiece, int oppPiece) {
        long score = 0;
        int size = board.length;

        for (int[] dir : DIRS) {
            int count = 1;
            int openEnds = 0;

            // Forward
            int nr = r + dir[0];
            int nc = c + dir[1];
            while (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] == myPiece) {
                count++;
                nr += dir[0];
                nc += dir[1];
            }
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] == CaroState.EMPTY) {
                openEnds++;
            }

            // Backward
            nr = r - dir[0];
            nc = c - dir[1];
            while (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] == myPiece) {
                count++;
                nr -= dir[0];
                nc -= dir[1];
            }
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] == CaroState.EMPTY) {
                openEnds++;
            }

            score += patternScore(count, openEnds);
        }
        return score;
    }

    private static long patternScore(int count, int openEnds) {
        if (count >= 5) return 1_000_000L;
        if (openEnds == 0) return 0L;
        return switch (count) {
            case 4 -> openEnds == 2 ? 100_000L : 15_000L;
            case 3 -> openEnds == 2 ? 12_000L : 1_200L;
            case 2 -> openEnds == 2 ? 800L : 120L;
            default -> openEnds == 2 ? 40L : 10L;
        };
    }

    private static boolean isWinningMove(int[][] board, int r, int c, int piece, boolean blockTwoEnds) {
        int opp = piece == CaroState.SEAT_X ? CaroState.SEAT_O : CaroState.SEAT_X;
        int size = board.length;
        for (int[] dir : DIRS) {
            int count = 1;
            int r1 = r + dir[0], c1 = c + dir[1];
            while (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size && board[r1][c1] == piece) {
                count++;
                r1 += dir[0];
                c1 += dir[1];
            }
            boolean blockedEnd1 = r1 >= 0 && r1 < size && c1 >= 0 && c1 < size && board[r1][c1] == opp;

            int r2 = r - dir[0], c2 = c - dir[1];
            while (r2 >= 0 && r2 < size && c2 >= 0 && c2 < size && board[r2][c2] == piece) {
                count++;
                r2 -= dir[0];
                c2 -= dir[1];
            }
            boolean blockedEnd2 = r2 >= 0 && r2 < size && c2 >= 0 && c2 < size && board[r2][c2] == opp;

            if (count >= 5) {
                if (!blockTwoEnds || !(blockedEnd1 && blockedEnd2)) {
                    return true;
                }
            }
        }
        return false;
    }
}
