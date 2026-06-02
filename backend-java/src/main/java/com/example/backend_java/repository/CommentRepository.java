package com.example.backend_java.repository;

import com.example.backend_java.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostId(Long postId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
