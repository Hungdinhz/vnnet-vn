package com.example.backend_java.mapper;

import com.example.backend_java.dto.game.GameResponseDto;
import com.example.backend_java.entity.Game;
import com.example.backend_java.entity.GameScore;
import com.example.backend_java.repository.GameMatchRepository;
import com.example.backend_java.repository.GameScoreRepository;
import com.example.backend_java.repository.UserGameRatingRepository;
import org.springframework.stereotype.Component;

@Component
public class GameMapper {

    private final GameScoreRepository gameScoreRepository;
    private final GameMatchRepository gameMatchRepository;
    private final UserGameRatingRepository userGameRatingRepository;

    public GameMapper(GameScoreRepository gameScoreRepository,
                      GameMatchRepository gameMatchRepository,
                      UserGameRatingRepository userGameRatingRepository) {
        this.gameScoreRepository = gameScoreRepository;
        this.gameMatchRepository = gameMatchRepository;
        this.userGameRatingRepository = userGameRatingRepository;
    }

    public GameResponseDto toResponseDto(Game game, Long currentUserId) {
        Integer userHighScore = null;
        Long userPlays = null;
        boolean isMultiplayer = "MULTIPLAYER".equalsIgnoreCase(game.getGameMode())
                || "HYBRID".equalsIgnoreCase(game.getGameMode());

        if (currentUserId != null) {
            if (isMultiplayer) {
                var ratingOpt = userGameRatingRepository.findByUserIdAndGameId(currentUserId, game.getId());
                if (ratingOpt.isPresent()) {
                    var r = ratingOpt.get();
                    userHighScore = r.getElo();
                    userPlays = (long) (r.getWins() + r.getLosses() + r.getDraws());
                }
            } else {
                userHighScore = gameScoreRepository.findTopByGameIdAndUserIdOrderByScoreDesc(game.getId(), currentUserId)
                        .map(GameScore::getScore).orElse(null);
                userPlays = gameScoreRepository.countByGameIdAndUserId(game.getId(), currentUserId);
            }
        }

        // Always compute REAL play count from DB (never fake seeded counts)
        long realPlayCount = isMultiplayer
                ? gameMatchRepository.countByGameId(game.getId())
                : gameScoreRepository.countByGameId(game.getId());

        int achievementsCount = game.getAchievements() != null ? game.getAchievements().size() : 0;

        return GameResponseDto.builder()
                .id(game.getId())
                .title(game.getTitle())
                .slug(game.getSlug())
                .description(game.getDescription())
                .category(game.getCategory())
                .gameMode(game.getGameMode() != null ? game.getGameMode() : "SINGLE")
                .minPlayers(game.getMinPlayers() != null ? game.getMinPlayers() : 1)
                .maxPlayers(game.getMaxPlayers() != null ? game.getMaxPlayers() : 1)
                .imageUrl(game.getImageUrl())
                .thumbnailUrl(game.getThumbnailUrl())
                .maxScore(game.getMaxScore())
                .difficulty(game.getDifficulty())
                .isActive(game.getIsActive())
                .playCount(realPlayCount)
                .createdAt(game.getCreatedAt())
                .currentUserHighScore(userHighScore)
                .currentUserPlays(userPlays)
                .achievementsCount(achievementsCount)
                .build();
    }
}
