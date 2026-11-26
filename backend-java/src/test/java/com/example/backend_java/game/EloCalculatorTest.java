package com.example.backend_java.game;

import com.example.backend_java.game.engine.EloCalculator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EloCalculatorTest {

    @Test
    void testEqualRatingsWinLoss() {
        int[] res = EloCalculator.calculate(1000, 1000, 1.0);
        assertEquals(1016, res[0]);
        assertEquals(984, res[1]);
    }

    @Test
    void testEqualRatingsDraw() {
        int[] res = EloCalculator.calculate(1000, 1000, 0.5);
        assertEquals(1000, res[0]);
        assertEquals(1000, res[1]);
    }

    @Test
    void testUnderdogWinGainsMorePoints() {
        int[] res = EloCalculator.calculate(900, 1300, 1.0);
        int gain = res[0] - 900;
        assertTrue(gain >= 25, "Người chơi ELO thấp thắng người ELO cao phải nhận nhiều điểm");
        assertTrue(res[1] < 1300);
    }

    @Test
    void testEloFloorNeverBelowMinimum() {
        int[] res = EloCalculator.calculate(105, 1500, 0.0);
        assertTrue(res[0] >= EloCalculator.MIN_ELO);
    }
}
