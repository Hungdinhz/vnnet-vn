package com.example.backend_java.repository;

import com.example.backend_java.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Lấy tất cả bài viết không thuộc nhóm nào, sắp xếp theo id giảm dần
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL ORDER BY p.id DESC")
    List<Post> findAllByOrderByIdDesc();

    // Lấy bài viết theo owner (chỉ lấy bài viết trên trang cá nhân, không thuộc nhóm)
    @Query("SELECT p FROM Post p WHERE p.ownerId = :ownerId AND p.groupId IS NULL ORDER BY p.id DESC")
    List<Post> findByOwnerIdOrderByIdDesc(@Param("ownerId") Long ownerId);

    // Lấy bài viết trong một nhóm cụ thể
    List<Post> findByGroupIdOrderByIdDesc(Long groupId);

    // Tìm kiếm bài viết theo title hoặc content (case-insensitive, chỉ bài không thuộc nhóm)
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY p.id DESC")
    Page<Post> searchByTitleOrContent(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY p.id DESC")
    List<Post> searchByTitleOrContent(@Param("query") String query);
}
