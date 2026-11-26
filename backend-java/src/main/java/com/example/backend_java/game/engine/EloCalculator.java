package com.example.backend_java.game.engine;

/**
 * Standard Elo rating calculator (K = 32, floor = 100).
 */
public final class EloCalculator {

    public static final int DEFAULT_ELO = 1000;
    public static final int K_FACTOR = 32;
    public static final int MIN_ELO = 100;

    private EloCalculator() {}

    /**
     * @param ratingA Current Elo of player A
     * @param ratingB Current Elo of player B
     * @param scoreA  1.0 for A win, 0.5 for draw, 0.0 for A loss
     * @return int[2] = { newRatingA, newRatingB }
     */
    public static int[] calculate(int ratingA, int ratingB, double scoreA) {
        double expectedA = 1.0 / (1.0 + Math.pow(10.0, (ratingB - ratingA) / 400.0));
        double expectedB = 1.0 - expectedA;
        double scoreB = 1.0 - scoreA;

        int newA = (int) Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
        int newB = (int) Math.round(ratingB + K_FACTOR * (scoreB - expectedB));

        // Guarantee at least +/-1 on decisive games if equal/normal
        if (scoreA == 1.0 && newA == ratingA) newA = ratingA + 1;
        if (scoreA == 0.0 && newB == ratingB) newB = ratingB + 1;

        return new int[]{
            Math.max(MIN_ELO, newA),
            Math.max(MIN_ELO, newB)
        };
    }
}
