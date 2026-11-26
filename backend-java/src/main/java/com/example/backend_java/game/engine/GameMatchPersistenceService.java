package com.example.backend_java.game.engine;

import com.example.backend_java.entity.*;
import com.example.backend_java.game.dto.GameMatchHistoryDto;
import com.example.backend_java.game.dto.UserGameRatingDto;
import com.example.backend_java.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameMatchPersistenceService {

    private final GameRepository gameRepository;
    private final GameMatchRepository gameMatchRepository;
    private final UserGameRatingRepository ratingRepository;
    private final GameScoreRepository gameScoreRepository;
    private final GameAchievementRepository gameAchievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;

    public int getUserElo(Long userId, Long gameId) {
        if (userId == null || gameId == null) return EloCalculator.DEFAULT_ELO;
        return ratingRepository.findByUserIdAndGameId(userId, gameId)
                .map(UserGameRating::getElo)
                .orElse(EloCalculator.DEFAULT_ELO);
    }

    @Transactional
    public void recordFinishedMatch(GameRoom room, Integer winnerSeat, String endReason, int totalMoves) {
        Game game = gameRepository.findById(room.getGameId()).orElse(null);
        if (game == null) return;

        int durationSeconds = 1;
        if (room.getStartedAtEpochMs() != null) {
            durationSeconds = (int) Math.max(1, (System.currentTimeMillis() - room.getStartedAtEpochMs()) / 1000L);
        }

        Long winnerUserId = null;
        if (winnerSeat != null) {
            winnerUserId = room.findPlayerBySeat(winnerSeat)
                    .filter(p -> !p.isBot())
                    .map(GameRoom.PlayerSlot::getUserId)
                    .orElse(null);
        }

        // Calculate ELO for 2-player human PvP matches
        boolean isPvp = !room.isVsBot() && room.getPlayers().size() == 2
                && room.getPlayers().stream().noneMatch(GameRoom.PlayerSlot::isBot);

        Map<Integer, Integer> eloBeforeMap = new HashMap<>();
        Map<Integer, Integer> eloAfterMap = new HashMap<>();

        if (isPvp) {
            GameRoom.PlayerSlot p0 = room.getPlayers().get(0);
            GameRoom.PlayerSlot p1 = room.getPlayers().get(1);

            UserGameRating r0 = getOrCreateRating(p0.getUserId(), game.getId());
            UserGameRating r1 = getOrCreateRating(p1.getUserId(), game.getId());

            eloBeforeMap.put(p0.getSeatIndex(), r0.getElo());
            eloBeforeMap.put(p1.getSeatIndex(), r1.getElo());

            double score0 = winnerSeat == null ? 0.5 : (winnerSeat == p0.getSeatIndex() ? 1.0 : 0.0);
            int[] newElos = EloCalculator.calculate(r0.getElo(), r1.getElo(), score0);

            updateRatingStats(r0, newElos[0], score0);
            updateRatingStats(r1, newElos[1], 1.0 - score0);

            ratingRepository.save(r0);
            ratingRepository.save(r1);

            eloAfterMap.put(p0.getSeatIndex(), newElos[0]);
            eloAfterMap.put(p1.getSeatIndex(), newElos[1]);

            p0.setEloDelta(newElos[0] - eloBeforeMap.get(p0.getSeatIndex()));
            p0.setElo(newElos[0]);
            p1.setEloDelta(newElos[1] - eloBeforeMap.get(p1.getSeatIndex()));
            p1.setElo(newElos[1]);
        } else {
            // Bot match: record wins/losses without changing PvP ELO drastically (or +5 on win)
            for (GameRoom.PlayerSlot slot : room.getPlayers()) {
                if (slot.isBot()) {
                    eloBeforeMap.put(slot.getSeatIndex(), 1100);
                    eloAfterMap.put(slot.getSeatIndex(), 1100);
                    continue;
                }
                UserGameRating r = getOrCreateRating(slot.getUserId(), game.getId());
                int before = r.getElo();
                eloBeforeMap.put(slot.getSeatIndex(), before);
                double score = winnerSeat == null ? 0.5 : (winnerSeat == slot.getSeatIndex() ? 1.0 : 0.0);
                int after = score == 1.0 ? before + 5 : before;
                updateRatingStats(r, after, score);
                ratingRepository.save(r);
                eloAfterMap.put(slot.getSeatIndex(), after);
                slot.setEloDelta(after - before);
                slot.setElo(after);
            }
        }

        // Persist GameMatch + GameMatchPlayers
        GameMatch match = GameMatch.builder()
                .gameId(game.getId())
                .roomCode(room.getRoomCode())
                .mode(room.isVsBot() ? "BOT" : "PVP")
                .status("FINISHED")
                .winnerId(winnerUserId)
                .durationSeconds(durationSeconds)
                .totalMoves(totalMoves)
                .endReason(endReason)
                .endedAt(LocalDateTime.now())
                .build();

        for (GameRoom.PlayerSlot slot : room.getPlayers()) {
            String result = winnerSeat == null ? "DRAW" : (winnerSeat == slot.getSeatIndex() ? "WIN" : "LOSS");
            int eloAfter = eloAfterMap.getOrDefault(slot.getSeatIndex(), slot.getElo());
            int eloBefore = eloBeforeMap.getOrDefault(slot.getSeatIndex(), slot.getElo());
            int matchScore = "WIN".equals(result) ? Math.max(500, eloAfter) : ("DRAW".equals(result) ? 300 : 150);

            GameMatchPlayer mp = GameMatchPlayer.builder()
                    .match(match)
                    .userId(slot.isBot() ? null : slot.getUserId())
                    .isBot(slot.isBot())
                    .displayName(slot.getUsername())
                    .seatIndex(slot.getSeatIndex())
                    .score(matchScore)
                    .eloBefore(eloBefore)
                    .eloAfter(eloAfter)
                    .result(result)
                    .build();
            match.getPlayers().add(mp);

            // Also record GameScore & unlock achievements for human players
            if (!slot.isBot() && slot.getUserId() != null) {
                User user = userRepository.findById(slot.getUserId()).orElse(null);
                if (user != null) {
                    int cappedScore = game.getMaxScore() != null ? Math.min(matchScore, game.getMaxScore()) : matchScore;
                    GameScore gs = GameScore.builder()
                            .game(game)
                            .gameId(game.getId())
                            .user(user)
                            .userId(user.getId())
                            .score(cappedScore)
                            .playTimeSeconds(durationSeconds)
                            .build();
                    gameScoreRepository.save(gs);
                    unlockAchievements(game, user, cappedScore);
                }
            }
        }

        gameMatchRepository.save(match);

        // Increment play count
        game.setPlayCount((game.getPlayCount() != null ? game.getPlayCount() : 0L) + 1L);
        gameRepository.save(game);
    }

    private UserGameRating getOrCreateRating(Long userId, Long gameId) {
        return ratingRepository.findByUserIdAndGameId(userId, gameId)
                .orElseGet(() -> UserGameRating.builder()
                        .userId(userId)
                        .gameId(gameId)
                        .elo(EloCalculator.DEFAULT_ELO)
                        .build());
    }

    private void updateRatingStats(UserGameRating rating, int newElo, double score) {
        rating.setElo(newElo);
        if (score == 1.0) {
            rating.setWins(rating.getWins() + 1);
            int streak = rating.getWinStreak() + 1;
            rating.setWinStreak(streak);
            if (streak > rating.getBestWinStreak()) {
                rating.setBestWinStreak(streak);
            }
        } else if (score == 0.0) {
            rating.setLosses(rating.getLosses() + 1);
            rating.setWinStreak(0);
        } else {
            rating.setDraws(rating.getDraws() + 1);
        }
    }

    private void unlockAchievements(Game game, User user, int score) {
        List<GameAchievement> achievements = gameAchievementRepository.findByGameId(game.getId());
        if (achievements.isEmpty()) return;

        long totalPlays = gameScoreRepository.countByGameIdAndUserId(game.getId(), user.getId());
        for (GameAchievement ach : achievements) {
            if (userAchievementRepository.existsByAchievementIdAndUserId(ach.getId(), user.getId())) {
                continue;
            }
            boolean scoreMet = ach.getRequiredScore() == null || ach.getRequiredScore() == 0 || score >= ach.getRequiredScore();
            boolean playsMet = ach.getRequiredPlays() == null || ach.getRequiredPlays() == 0 || totalPlays >= ach.getRequiredPlays();
            if (scoreMet && playsMet) {
                userAchievementRepository.save(UserAchievement.builder()
                        .user(user)
                        .userId(user.getId())
                        .achievement(ach)
                        .achievementId(ach.getId())
                        .build());
            }
        }
    }

    public List<UserGameRatingDto> getEloLeaderboard(Long gameId, int limit) {
        List<UserGameRating> ratings = ratingRepository.findByGameIdOrderByEloDescWinsDesc(
                gameId, PageRequest.of(0, Math.min(Math.max(limit, 1), 50)));

        Set<Long> userIds = ratings.stream().map(UserGameRating::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<UserGameRatingDto> result = new ArrayList<>();
        int rank = 1;
        for (UserGameRating r : ratings) {
            User u = userMap.get(r.getUserId());
            int total = r.getWins() + r.getLosses() + r.getDraws();
            double winRate = total > 0 ? Math.round((r.getWins() * 1000.0) / total) / 10.0 : 0.0;
            result.add(UserGameRatingDto.builder()
                    .rank(rank++)
                    .userId(r.getUserId())
                    .username(u != null ? u.getUsername() : "Người chơi #" + r.getUserId())
                    .avatarUrl(u != null ? u.getAvatarUrl() : null)
                    .elo(r.getElo())
                    .wins(r.getWins())
                    .losses(r.getLosses())
                    .draws(r.getDraws())
                    .winStreak(r.getWinStreak())
                    .bestWinStreak(r.getBestWinStreak())
                    .winRate(winRate)
                    .build());
        }
        return result;
    }

    public UserGameRatingDto getMyRating(Long gameId, User user) {
        UserGameRating r = ratingRepository.findByUserIdAndGameId(user.getId(), gameId)
                .orElseGet(() -> UserGameRating.builder()
                        .userId(user.getId())
                        .gameId(gameId)
                        .elo(EloCalculator.DEFAULT_ELO)
                        .build());
        int total = r.getWins() + r.getLosses() + r.getDraws();
        double winRate = total > 0 ? Math.round((r.getWins() * 1000.0) / total) / 10.0 : 0.0;
        return UserGameRatingDto.builder()
                .rank(0)
                .userId(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .elo(r.getElo())
                .wins(r.getWins())
                .losses(r.getLosses())
                .draws(r.getDraws())
                .winStreak(r.getWinStreak())
                .bestWinStreak(r.getBestWinStreak())
                .winRate(winRate)
                .build();
    }

    public List<GameMatchHistoryDto> getMyMatchHistory(Long gameId, Long userId, int limit) {
        List<GameMatch> matches = gameMatchRepository.findRecentMatchesForUser(
                gameId, userId, PageRequest.of(0, Math.min(Math.max(limit, 1), 30)));

        return matches.stream().map(m -> GameMatchHistoryDto.builder()
                .id(m.getId())
                .roomCode(m.getRoomCode())
                .mode(m.getMode())
                .endReason(m.getEndReason())
                .durationSeconds(m.getDurationSeconds())
                .totalMoves(m.getTotalMoves())
                .winnerId(m.getWinnerId())
                .createdAt(m.getCreatedAt())
                .players(m.getPlayers().stream()
                        .sorted(Comparator.comparingInt(GameMatchPlayer::getSeatIndex))
                        .map(p -> GameMatchHistoryDto.PlayerOutcome.builder()
                                .userId(p.getUserId())
                                .displayName(p.getDisplayName())
                                .bot(Boolean.TRUE.equals(p.getIsBot()))
                                .seatIndex(p.getSeatIndex())
                                .eloBefore(p.getEloBefore())
                                .eloAfter(p.getEloAfter())
                                .result(p.getResult())
                                .build())
                        .collect(Collectors.toList()))
                .build()).collect(Collectors.toList());
    }
}
