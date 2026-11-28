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

        // Calculate ELO ONLY for real 2-player human PvP matches (NEVER for Bot matches)
        boolean isPvp = !room.isVsBot() && room.getPlayers().size() == 2
                && room.getPlayers().stream().noneMatch(GameRoom.PlayerSlot::isBot);

        // Anti-farm guard: if a PvP match ends by FORFEIT/DISCONNECT before 4 total moves, abort without ELO/score changes
        boolean isAbortedEarly = isPvp && totalMoves < 4
                && ("FORFEIT".equals(endReason) || "DISCONNECT".equals(endReason));

        Map<Integer, Integer> eloBeforeMap = new HashMap<>();
        Map<Integer, Integer> eloAfterMap = new HashMap<>();
        Map<Integer, Integer> winStreakAfterMap = new HashMap<>();

        if (isPvp && !isAbortedEarly) {
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
            winStreakAfterMap.put(p0.getSeatIndex(), r0.getWinStreak());
            winStreakAfterMap.put(p1.getSeatIndex(), r1.getWinStreak());

            p0.setEloDelta(newElos[0] - eloBeforeMap.get(p0.getSeatIndex()));
            p0.setElo(newElos[0]);
            p1.setEloDelta(newElos[1] - eloBeforeMap.get(p1.getSeatIndex()));
            p1.setElo(newElos[1]);
        } else {
            // Bot practice match OR early-aborted match: DO NOT touch ELO or wins/losses/draws!
            for (GameRoom.PlayerSlot slot : room.getPlayers()) {
                int currentElo = slot.isBot() ? slot.getElo() : getUserElo(slot.getUserId(), game.getId());
                eloBeforeMap.put(slot.getSeatIndex(), currentElo);
                eloAfterMap.put(slot.getSeatIndex(), currentElo);
                slot.setEloDelta(null);
            }
            if (isAbortedEarly) {
                room.setSystemMessage("Trận đấu kết thúc quá sớm (< 4 nước đi) nên không tính điểm ELO.");
            }
        }

        // Persist GameMatch + GameMatchPlayers
        GameMatch match = GameMatch.builder()
                .gameId(game.getId())
                .roomCode(room.getRoomCode())
                .mode(room.isVsBot() ? "BOT" : "PVP")
                .status(isAbortedEarly ? "ABORTED" : "FINISHED")
                .winnerId(isAbortedEarly ? null : winnerUserId)
                .durationSeconds(durationSeconds)
                .totalMoves(totalMoves)
                .endReason(endReason)
                .endedAt(LocalDateTime.now())
                .build();

        for (GameRoom.PlayerSlot slot : room.getPlayers()) {
            String result = isAbortedEarly
                    ? "DRAW"
                    : (winnerSeat == null ? "DRAW" : (winnerSeat == slot.getSeatIndex() ? "WIN" : "LOSS"));
            int eloAfter = eloAfterMap.getOrDefault(slot.getSeatIndex(), slot.getElo());
            int eloBefore = eloBeforeMap.getOrDefault(slot.getSeatIndex(), slot.getElo());

            // Fair real-world match score (ONLY for valid PvP matches; Bot & aborted = 0)
            int matchScore = 0;
            if (isPvp && !isAbortedEarly) {
                if ("WIN".equals(result)) {
                    int baseWin = 100;
                    int efficiencyBonus = totalMoves <= 25 ? 50 : (totalMoves <= 45 ? 30 : 20);
                    int streak = winStreakAfterMap.getOrDefault(slot.getSeatIndex(), 1);
                    int streakBonus = Math.min(50, Math.max(0, (streak - 1) * 10));
                    matchScore = baseWin + efficiencyBonus + streakBonus; // 120 - 200 pts
                } else if ("DRAW".equals(result) && totalMoves >= 10) {
                    matchScore = 50;
                }
            }

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

            // Record GameScore & achievements ONLY for real PvP matches with positive score (never Bot farming!)
            if (isPvp && !isAbortedEarly && !slot.isBot() && slot.getUserId() != null && matchScore > 0) {
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
                    unlockAchievements(game, user, eloAfter);
                }
            }
        }

        gameMatchRepository.save(match);

        // Sync real play count from DB
        long realPlays = gameMatchRepository.countByGameId(game.getId());
        game.setPlayCount(realPlays);
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
