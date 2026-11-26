package com.example.backend_java.repository;

import com.example.backend_java.entity.UserGameRating;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGameRatingRepository extends JpaRepository<UserGameRating, Long> {

    Optional<UserGameRating> findByUserIdAndGameId(Long userId, Long gameId);

    List<UserGameRating> findByGameIdOrderByEloDescWinsDesc(Long gameId, Pageable pageable);
}
