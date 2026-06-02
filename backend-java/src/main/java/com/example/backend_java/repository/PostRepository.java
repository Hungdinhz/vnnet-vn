package com.example.backend_java.repository;

import com.example.backend_java.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Lấy tất cả bài viết sắp xếp theo id giảm dần (mới nhất trước)
    List<Post> findAllByOrderByIdDesc();

    // Lấy bài viết theo owner
    List<Post> findByOwnerIdOrderByIdDesc(Long ownerId);
}
