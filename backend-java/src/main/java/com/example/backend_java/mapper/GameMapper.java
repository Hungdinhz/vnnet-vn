package com.example.backend_java.mapper;

import com.example.backend_java.dto.game.GameResponseDto;
import com.example.backend_java.entity.Game;
import com.example.backend_java.entity.GameScore;
import com.example.backend_java.repository.GameScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GameMapper {

    private final GameScoreRepository gameScoreRepository;

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
}
