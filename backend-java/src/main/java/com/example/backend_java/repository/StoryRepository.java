package com.example.backend_java.repository;

import com.example.backend_java.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    @Query("SELECT s FROM Story s WHERE s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findActiveStories(@Param("now") LocalDateTime now);

    @Query("SELECT s FROM Story s WHERE s.ownerId = :ownerId AND s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findActiveByOwnerId(@Param("ownerId") Long ownerId, @Param("now") LocalDateTime now);

    List<Story> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
