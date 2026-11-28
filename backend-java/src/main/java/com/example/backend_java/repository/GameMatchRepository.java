package com.example.backend_java.repository;

import com.example.backend_java.entity.GameMatch;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameMatchRepository extends JpaRepository<GameMatch, Long> {

    long countByGameId(Long gameId);

    @Query("SELECT DISTINCT m FROM GameMatch m JOIN FETCH m.players p " +
           "WHERE m.gameId = :gameId AND EXISTS (" +
           "  SELECT 1 FROM GameMatchPlayer mp WHERE mp.match = m AND mp.userId = :userId" +
           ") ORDER BY m.createdAt DESC")
    List<GameMatch> findRecentMatchesForUser(@Param("gameId") Long gameId, @Param("userId") Long userId, Pageable pageable);
}
