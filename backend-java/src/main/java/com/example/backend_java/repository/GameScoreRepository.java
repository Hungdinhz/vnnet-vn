package com.example.backend_java.repository;

import com.example.backend_java.entity.GameScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {

    List<GameScore> findByGameIdAndUserIdOrderByScoreDesc(Long gameId, Long userId);

    Optional<GameScore> findTopByGameIdAndUserIdOrderByScoreDesc(Long gameId, Long userId);

    long countByGameIdAndUserId(Long gameId, Long userId);

    long countByUserId(Long userId);

    @Query("SELECT gs.user.id, MAX(gs.score) as highScore, COUNT(gs.id) as totalPlays, MAX(gs.createdAt) as lastPlayed " +
           "FROM GameScore gs WHERE gs.gameId = :gameId GROUP BY gs.user.id ORDER BY highScore DESC")
    List<Object[]> findLeaderboardByGameId(@Param("gameId") Long gameId, Pageable pageable);

    @Query("SELECT COUNT(DISTINCT gs.userId) FROM GameScore gs WHERE gs.gameId = :gameId")
    long countDistinctUsersByGameId(@Param("gameId") Long gameId);

    @Query("SELECT gs.user.id, SUM(gs.score) as totalScore, COUNT(gs.id) as totalPlays, MAX(gs.createdAt) as lastPlayed " +
           "FROM GameScore gs GROUP BY gs.user.id ORDER BY totalScore DESC")
    List<Object[]> findGlobalLeaderboard(Pageable pageable);

    @Query("SELECT COUNT(DISTINCT gs.userId) FROM GameScore gs")
    long countDistinctUsersGlobal();

    @Query("SELECT COALESCE(SUM(gs.score), 0) FROM GameScore gs WHERE gs.userId = :userId")
    Long sumScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT gs.gameId) FROM GameScore gs WHERE gs.userId = :userId")
    long countDistinctGamesByUserId(@Param("userId") Long userId);

    @Query("SELECT gs.gameId, COUNT(gs.id) as playCount FROM GameScore gs WHERE gs.userId = :userId GROUP BY gs.gameId ORDER BY playCount DESC")
    List<Object[]> findMostPlayedGameByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(gs) FROM GameScore gs WHERE gs.gameId = :gameId " +
           "AND gs.userId = :userId AND gs.createdAt > :since")
    long countRecentSubmissions(@Param("gameId") Long gameId,
                                @Param("userId") Long userId,
                                @Param("since") LocalDateTime since);

    List<GameScore> findTop10ByGameIdAndUserIdOrderByCreatedAtDesc(Long gameId, Long userId);

    List<GameScore> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);
}
