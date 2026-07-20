package com.example.backend_java.repository;

import com.example.backend_java.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {

    boolean existsByStoryIdAndViewerId(Long storyId, Long viewerId);

    long countByStoryId(Long storyId);

    List<StoryView> findByStoryIdOrderByViewedAtDesc(Long storyId);
}
