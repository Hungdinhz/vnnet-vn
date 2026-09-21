package com.example.backend_java.service;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.*;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GameScoreRepository gameScoreRepository;
    private final GameAchievementRepository gameAchievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public GameService(GameRepository gameRepository,
                       GameScoreRepository gameScoreRepository,
                       GameAchievementRepository gameAchievementRepository,
                       UserAchievementRepository userAchievementRepository,
                       UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider) {
        this.gameRepository = gameRepository;
        this.gameScoreRepository = gameScoreRepository;
        this.gameAchievementRepository = gameAchievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public List<GameResponseDto> getAllGames(String category, String keyword, Long currentUserId) {
        List<Game> games;

        if (keyword != null && !keyword.trim().isEmpty()) {
            games = gameRepository.searchByTitle(keyword.trim());
        } else if (category != null && !category.trim().isEmpty()
                && !"ALL".equalsIgnoreCase(category)
                && !"Tất cả".equalsIgnoreCase(category)) {
            games = gameRepository.findByCategoryAndIsActiveTrueOrderByPlayCountDesc(category.trim().toUpperCase());
        } else {
            games = gameRepository.findByIsActiveTrueOrderByPlayCountDesc();
        }

        return games.stream()
                .map(game -> toResponseDto(game, currentUserId))
                .collect(Collectors.toList());
    }

    public GameResponseDto getGameById(Long id, Long currentUserId) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trò chơi"));
        return toResponseDto(game, currentUserId);
    }

    @Transactional
    public GameScoreResponseDto submitScore(Long gameId, User currentUser, GameScoreCreateDto dto) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trò chơi"));

        if (!Boolean.TRUE.equals(game.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trò chơi này hiện đang tạm dừng hoạt động");
        }

        if (game.getMaxScore() != null && dto.getScore() > game.getMaxScore()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Điểm số không hợp lệ. Điểm tối đa cho phép là " + game.getMaxScore());
        }

        // Rate limiting check: 1 submission per 5 seconds
        LocalDateTime fiveSecondsAgo = LocalDateTime.now().minusSeconds(5);
        long recentCount = gameScoreRepository.countRecentSubmissions(gameId, currentUser.getId(), fiveSecondsAgo);
        if (recentCount > 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn gửi điểm quá nhanh, vui lòng đợi vài giây trước khi thử lại");
        }

        // Save score
        GameScore gameScore = GameScore.builder()
                .game(game)
                .gameId(game.getId())
                .user(currentUser)
                .userId(currentUser.getId())
                .score(dto.getScore())
                .playTimeSeconds(dto.getPlayTimeSeconds())
                .build();
        gameScore = gameScoreRepository.save(gameScore);

        // Increment game play count
        game.setPlayCount((game.getPlayCount() != null ? game.getPlayCount() : 0L) + 1L);
        gameRepository.save(game);

        // Check & unlock achievements
        List<GameAchievementDto> newlyUnlocked = checkAndUnlockAchievements(game, currentUser, dto.getScore());

        // Calculate rank for this score
        int rank = 1;
        Optional<GameScore> bestScoreOpt = gameScoreRepository.findTopByGameIdAndUserIdOrderByScoreDesc(gameId, currentUser.getId());
        int effectiveHighScore = bestScoreOpt.map(GameScore::getScore).orElse(dto.getScore());
        List<Object[]> leaderboard = gameScoreRepository.findLeaderboardByGameId(gameId, PageRequest.of(0, 500));
        for (int i = 0; i < leaderboard.size(); i++) {
            Long rowUserId = ((Number) leaderboard.get(i)[0]).longValue();
            if (rowUserId.equals(currentUser.getId())) {
                rank = i + 1;
                break;
            }
        }

        return GameScoreResponseDto.builder()
                .id(gameScore.getId())
                .gameId(game.getId())
                .gameTitle(game.getTitle())
                .user(GameScoreResponseDto.UserOutDto.builder()
                        .id(currentUser.getId())
                        .username(currentUser.getUsername())
                        .avatarUrl(currentUser.getAvatarUrl())
                        .build())
                .score(gameScore.getScore())
                .playTimeSeconds(gameScore.getPlayTimeSeconds())
                .createdAt(gameScore.getCreatedAt())
                .rank(rank)
                .unlockedAchievements(newlyUnlocked)
                .build();
    }

    public PagedResponseDto<LeaderboardEntryDto> getLeaderboard(Long gameId, int page, int size) {
        if (!gameRepository.existsById(gameId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trò chơi");
        }

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        List<Object[]> results = gameScoreRepository.findLeaderboardByGameId(gameId, pageable);
        long totalElements = gameScoreRepository.countDistinctUsersByGameId(gameId);
        int totalPages = (int) Math.ceil((double) totalElements / pageable.getPageSize());

        List<LeaderboardEntryDto> entries = buildLeaderboardEntries(results, pageable.getPageNumber(), pageable.getPageSize());

        return PagedResponseDto.<LeaderboardEntryDto>builder()
                .content(entries)
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(pageable.getPageNumber() + 1 < totalPages)
                .build();
    }

    public PagedResponseDto<LeaderboardEntryDto> getGlobalLeaderboard(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        List<Object[]> results = gameScoreRepository.findGlobalLeaderboard(pageable);
        long totalElements = gameScoreRepository.countDistinctUsersGlobal();
        int totalPages = (int) Math.ceil((double) totalElements / pageable.getPageSize());

        List<LeaderboardEntryDto> entries = buildLeaderboardEntries(results, pageable.getPageNumber(), pageable.getPageSize());

        return PagedResponseDto.<LeaderboardEntryDto>builder()
                .content(entries)
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(pageable.getPageNumber() + 1 < totalPages)
                .build();
    }

    public List<GameAchievementDto> getGameAchievements(Long gameId, Long currentUserId) {
        List<GameAchievement> achievements = gameAchievementRepository.findByGameId(gameId);

        Set<Long> unlockedIds = new HashSet<>();
        Map<Long, LocalDateTime> unlockedDates = new HashMap<>();

        if (currentUserId != null) {
            List<UserAchievement> userAchievements = userAchievementRepository.findByUserId(currentUserId);
            for (UserAchievement ua : userAchievements) {
                Long achId = ua.getAchievement() != null ? ua.getAchievement().getId() : ua.getAchievementId();
                if (achId != null) {
                    unlockedIds.add(achId);
                    unlockedDates.put(achId, ua.getUnlockedAt());
                }
            }
        }

        return achievements.stream().map(a -> GameAchievementDto.builder()
                .id(a.getId())
                .gameId(a.getGameId())
                .title(a.getTitle())
                .description(a.getDescription())
                .icon(a.getIcon())
                .requiredScore(a.getRequiredScore())
                .requiredPlays(a.getRequiredPlays())
                .unlockedByCurrentUser(unlockedIds.contains(a.getId()))
                .unlockedAt(unlockedDates.get(a.getId()))
                .build()
        ).collect(Collectors.toList());
    }

    public List<GameScoreResponseDto> getUserScoresForGame(Long gameId, Long userId) {
        List<GameScore> scores = gameScoreRepository.findTop10ByGameIdAndUserIdOrderByCreatedAtDesc(gameId, userId);
        return scores.stream().map(s -> GameScoreResponseDto.builder()
                .id(s.getId())
                .gameId(s.getGameId())
                .score(s.getScore())
                .playTimeSeconds(s.getPlayTimeSeconds())
                .createdAt(s.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    public GameStatsDto getUserStats(Long userId) {
        long totalGames = gameScoreRepository.countDistinctGamesByUserId(userId);
        long totalPlays = gameScoreRepository.countByUserId(userId);
        Long totalScore = gameScoreRepository.sumScoreByUserId(userId);
        long achievementsCount = userAchievementRepository.countByUserId(userId);

        GameResponseDto favGame = null;
        List<Object[]> favList = gameScoreRepository.findMostPlayedGameByUserId(userId, PageRequest.of(0, 1));
        if (!favList.isEmpty()) {
            Long favGameId = ((Number) favList.get(0)[0]).longValue();
            favGame = gameRepository.findById(favGameId)
                    .map(g -> toResponseDto(g, userId))
                    .orElse(null);
        }

        List<GameScore> recentScores = gameScoreRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
        List<GameScoreResponseDto> recentScoreDtos = recentScores.stream().map(s -> GameScoreResponseDto.builder()
                .id(s.getId())
                .gameId(s.getGameId())
                .gameTitle(s.getGame() != null ? s.getGame().getTitle() : "")
                .score(s.getScore())
                .playTimeSeconds(s.getPlayTimeSeconds())
                .createdAt(s.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return GameStatsDto.builder()
                .totalGamesPlayed(totalGames)
                .totalPlays(totalPlays)
                .totalScore(totalScore != null ? totalScore : 0L)
                .achievementsUnlocked(achievementsCount)
                .favoriteGame(favGame)
                .recentScores(recentScoreDtos)
                .build();
    }

    private List<LeaderboardEntryDto> buildLeaderboardEntries(List<Object[]> results, int page, int size) {
        if (results.isEmpty()) return Collections.emptyList();

        List<Long> userIds = results.stream()
                .map(r -> ((Number) r[0]).longValue())
                .collect(Collectors.toList());

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<LeaderboardEntryDto> list = new ArrayList<>();
        int baseRank = page * size;
        for (int i = 0; i < results.size(); i++) {
            Object[] row = results.get(i);
            Long userId = ((Number) row[0]).longValue();
            Integer score = ((Number) row[1]).intValue();
            Long plays = ((Number) row[2]).longValue();
            LocalDateTime lastPlayed = (LocalDateTime) row[3];

            User user = userMap.get(userId);
            LeaderboardEntryDto.UserOutDto userDto = LeaderboardEntryDto.UserOutDto.builder()
                    .id(userId)
                    .username(user != null ? user.getUsername() : "Người chơi")
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .build();

            list.add(LeaderboardEntryDto.builder()
                    .rank(baseRank + i + 1)
                    .user(userDto)
                    .highScore(score)
                    .totalPlays(plays)
                    .lastPlayedAt(lastPlayed)
                    .build());
        }
        return list;
    }

    private List<GameAchievementDto> checkAndUnlockAchievements(Game game, User user, int newScore) {
        List<GameAchievement> achievements = gameAchievementRepository.findByGameId(game.getId());
        if (achievements.isEmpty()) return Collections.emptyList();

        long totalPlays = gameScoreRepository.countByGameIdAndUserId(game.getId(), user.getId());
        Optional<GameScore> topScoreOpt = gameScoreRepository.findTopByGameIdAndUserIdOrderByScoreDesc(game.getId(), user.getId());
        int highScore = topScoreOpt.map(GameScore::getScore).orElse(newScore);

        // Lấy danh sách ID các thành tựu user đã mở khóa trước đó
        List<UserAchievement> existingUserAchievements = userAchievementRepository.findByUserId(user.getId());
        Set<Long> alreadyUnlockedIds = existingUserAchievements.stream()
                .map(ua -> ua.getAchievement() != null ? ua.getAchievement().getId() : ua.getAchievementId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<GameAchievementDto> newlyUnlocked = new ArrayList<>();

        for (GameAchievement a : achievements) {
            if (alreadyUnlockedIds.contains(a.getId()) || userAchievementRepository.existsByAchievementIdAndUserId(a.getId(), user.getId())) {
                continue;
            }

            boolean scoreQualified = a.getRequiredScore() != null && a.getRequiredScore() > 0 && highScore >= a.getRequiredScore();
            boolean playsQualified = a.getRequiredPlays() != null && a.getRequiredPlays() > 0 && totalPlays >= a.getRequiredPlays();

            if (scoreQualified || playsQualified) {
                try {
                    UserAchievement ua = UserAchievement.builder()
                            .achievement(a)
                            .achievementId(a.getId())
                            .user(user)
                            .userId(user.getId())
                            .build();
                    ua = userAchievementRepository.save(ua);
                    alreadyUnlockedIds.add(a.getId());

                    newlyUnlocked.add(GameAchievementDto.builder()
                            .id(a.getId())
                            .gameId(a.getGameId())
                            .title(a.getTitle())
                            .description(a.getDescription())
                            .icon(a.getIcon())
                            .requiredScore(a.getRequiredScore())
                            .requiredPlays(a.getRequiredPlays())
                            .unlockedByCurrentUser(true)
                            .unlockedAt(ua.getUnlockedAt())
                            .build());
                } catch (Exception ignored) {
                    // Nếu đã có bản ghi tồn tại do race condition thì bỏ qua an toàn
                    alreadyUnlockedIds.add(a.getId());
                }
            }
        }
        return newlyUnlocked;
    }

    public GameResponseDto toResponseDto(Game game, Long currentUserId) {
        Integer userHighScore = null;
        Long userPlays = null;

        if (currentUserId != null) {
            userHighScore = gameScoreRepository.findTopByGameIdAndUserIdOrderByScoreDesc(game.getId(), currentUserId)
                    .map(GameScore::getScore).orElse(null);
            userPlays = gameScoreRepository.countByGameIdAndUserId(game.getId(), currentUserId);
        }

        int achievementsCount = game.getAchievements() != null ? game.getAchievements().size() : 0;

        return GameResponseDto.builder()
                .id(game.getId())
                .title(game.getTitle())
                .description(game.getDescription())
                .category(game.getCategory())
                .imageUrl(game.getImageUrl())
                .thumbnailUrl(game.getThumbnailUrl())
                .maxScore(game.getMaxScore())
                .difficulty(game.getDifficulty())
                .isActive(game.getIsActive())
                .playCount(game.getPlayCount() != null ? game.getPlayCount() : 0L)
                .createdAt(game.getCreatedAt())
                .currentUserHighScore(userHighScore)
                .currentUserPlays(userPlays)
                .achievementsCount(achievementsCount)
                .build();
    }

    public Long resolveCurrentUserId(String authHeader) {
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtTokenProvider.validateToken(token)) {
                    String email = jwtTokenProvider.getEmailFromToken(token);
                    return userRepository.findByEmail(email).map(User::getId).orElse(null);
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }
}
