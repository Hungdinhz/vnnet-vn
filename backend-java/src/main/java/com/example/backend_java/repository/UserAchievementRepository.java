package com.example.backend_java.repository;

import com.example.backend_java.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    @Query("SELECT ua FROM UserAchievement ua WHERE ua.userId = :userId OR ua.user.id = :userId")
    List<UserAchievement> findByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(ua) > 0 FROM UserAchievement ua WHERE (ua.achievementId = :achievementId OR ua.achievement.id = :achievementId) AND (ua.userId = :userId OR ua.user.id = :userId)")
    boolean existsByAchievementIdAndUserId(@Param("achievementId") Long achievementId, @Param("userId") Long userId);

    @Query("SELECT COUNT(ua) FROM UserAchievement ua WHERE ua.userId = :userId OR ua.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
