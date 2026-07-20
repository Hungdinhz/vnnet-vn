package com.example.backend_java.repository;

import com.example.backend_java.entity.PostMention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMentionRepository extends JpaRepository<PostMention, Long> {

    List<PostMention> findByPostId(Long postId);

    void deleteByPostId(Long postId);
}
