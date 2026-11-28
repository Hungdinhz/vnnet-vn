package com.example.backend_java.game.caro;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/**
 * Multi-level tactical Bot AI for 15x15 Caro (Gomoku):
 * - EASY: Beginner-friendly, makes occasional mistakes and plays from top candidates with variance.
 * - MEDIUM: Balanced tactical heuristic (blocks threats & attacks reliably).
 * - HARD: Ruthless 2-ply lookahead — takes immediate wins, blocks forced wins/open-3 forks, and minimizes opponent's best reply.
 */
public final class CaroBotAi {

    public enum Difficulty {
        EASY, MEDIUM, HARD;

        public static Difficulty fromString(Object raw) {
            if (raw == null) return MEDIUM;
            String s = raw.toString().trim().toUpperCase();
            return switch (s) {
                case "EASY", "DE" -> EASY;
                case "HARD", "KHO" -> HARD;
                default -> MEDIUM;
            };
        }
    }

    private static final int[][] DIRS = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};
    private static final Random RANDOM = new Random();

    private CaroBotAi() {}

    public static int[] chooseBestMove(int[][] board, int botPiece, int humanPiece, boolean blockTwoEnds) {
        return chooseBestMove(board, botPiece, humanPiece, blockTwoEnds, Difficulty.MEDIUM);
    }

    public static int[] chooseBestMove(int[][] board, int botPiece, int humanPiece, boolean blockTwoEnds, Difficulty difficulty) {
        Difficulty level = difficulty != null ? difficulty : Difficulty.MEDIUM;
        int size = board.length;
        int center = size / 2;

        // First move: play center
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

        // 1. Always take an immediate winning move (on MEDIUM & HARD, and 70% on EASY)
        for (int[] cell : candidates) {
            int r = cell[0], c = cell[1];
            board[r][c] = botPiece;
            boolean wins = isWinningMove(board, r, c, botPiece, blockTwoEnds);
            board[r][c] = CaroState.EMPTY;
            if (wins && (level != Difficulty.EASY || RANDOM.nextDouble() < 0.7)) {
                return new int[]{r, c};
            }
        }

        // 2. Block opponent's immediate winning move (always on MEDIUM & HARD, 45% on EASY)
        for (int[] cell : candidates) {
            int r = cell[0], c = cell[1];
            board[r][c] = humanPiece;
            boolean humanWins = isWinningMove(board, r, c, humanPiece, blockTwoEnds);
            board[r][c] = CaroState.EMPTY;
            if (humanWins && (level != Difficulty.EASY || RANDOM.nextDouble() < 0.45)) {
                return new int[]{r, c};
            }
        }

        // 3. Score all candidates heuristically
        List<ScoredMove> scored = new ArrayList<>(candidates.size());
        for (int[] cell : candidates) {
            int r = cell[0], c = cell[1];
            long attack = evaluateCell(board, r, c, botPiece, humanPiece);
            long defense = evaluateCell(board, r, c, humanPiece, botPiece);
            long centerBias = 14 - (Math.abs(r - center) + Math.abs(c - center));
            long total = switch (level) {
                case EASY -> (long) (attack * 0.8 + defense * 0.7 + centerBias + RANDOM.nextInt(1500));
                case MEDIUM -> attack + (long) (defense * 1.15) + centerBias;
                case HARD -> (long) (attack * 1.15) + (long) (defense * 1.25) + centerBias;
            };
            scored.add(new ScoredMove(r, c, total));
        }

        scored.sort(Comparator.comparingLong(ScoredMove::score).reversed());

        if (level == Difficulty.EASY) {
            int pool = Math.min(5, scored.size());
            ScoredMove pick = scored.get(RANDOM.nextInt(pool));
            return new int[]{pick.row, pick.col};
        }

        if (level == Difficulty.MEDIUM) {
            long topScore = scored.get(0).score;
            List<ScoredMove> ties = new ArrayList<>();
            for (ScoredMove sm : scored) {
                if (sm.score >= topScore - 50) ties.add(sm);
                else break;
            }
            ScoredMove pick = ties.get(RANDOM.nextInt(ties.size()));
            return new int[]{pick.row, pick.col};
        }

        // HARD: 2-ply lookahead over top 8 candidates to avoid walking into human forks and create own forks
        int beam = Math.min(8, scored.size());
        long bestFinal = Long.MIN_VALUE;
        int[] bestHardMove = new int[]{scored.get(0).row, scored.get(0).col};

        for (int i = 0; i < beam; i++) {
            ScoredMove cand = scored.get(i);
            board[cand.row][cand.col] = botPiece;

            // Estimate human's strongest counter-reply among top local candidates
            long worstHumanReply = 0;
            for (int[] reply : candidates) {
                if (reply[0] == cand.row && reply[1] == cand.col) continue;
                if (board[reply[0]][reply[1]] != CaroState.EMPTY) continue;
                long hAttack = evaluateCell(board, reply[0], reply[1], humanPiece, botPiece);
                if (hAttack > worstHumanReply) {
                    worstHumanReply = hAttack;
                }
            }

            board[cand.row][cand.col] = CaroState.EMPTY;

            long finalScore = cand.score - (long) (worstHumanReply * 0.65);
            if (finalScore > bestFinal) {
                bestFinal = finalScore;
                bestHardMove = new int[]{cand.row, cand.col};
            }
        }

        return bestHardMove;
    }

    private record ScoredMove(int row, int col, long score) {}

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
        int openThrees = 0;
        int fours = 0;

        for (int[] dir : DIRS) {
            int count = 1;
            int openEnds = 0;

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

            if (count == 4 && openEnds >= 1) fours++;
            if (count == 3 && openEnds == 2) openThrees++;

            score += patternScore(count, openEnds);
        }

        // Double-threat fork bonus (4+3 or double open-3 is virtually unstoppable)
        if (fours >= 2 || (fours >= 1 && openThrees >= 1)) score += 250_000L;
        else if (openThrees >= 2) score += 80_000L;

        return score;
    }

    private static long patternScore(int count, int openEnds) {
        if (count >= 5) return 1_000_000L;
        if (openEnds == 0) return 0L;
        return switch (count) {
            case 4 -> openEnds == 2 ? 120_000L : 18_000L;
            case 3 -> openEnds == 2 ? 14_000L : 1_400L;
            case 2 -> openEnds == 2 ? 900L : 120L;
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
