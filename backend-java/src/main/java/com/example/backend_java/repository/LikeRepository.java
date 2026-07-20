package com.example.backend_java.repository;

import com.example.backend_java.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    void deleteByPostId(Long postId);

    List<Like> findAllByPostId(Long postId);

    @Query("SELECT l.reactionType, COUNT(l) FROM Like l WHERE l.postId = :postId GROUP BY l.reactionType")
    List<Object[]> countReactionsByPostId(@Param("postId") Long postId);
}

