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

    // Lấy tất cả bài viết (bao gồm cả bài trong nhóm), lọc bài đã bị admin ẩn
    @Query("SELECT p FROM Post p WHERE COALESCE(p.isHidden, false) = false ORDER BY p.id DESC")
    List<Post> findAllByOrderByIdDesc();

    // Lấy bài viết theo owner (lọc bài đã bị ẩn)
    @Query("SELECT p FROM Post p WHERE p.ownerId = :ownerId AND COALESCE(p.isHidden, false) = false ORDER BY p.id DESC")
    List<Post> findByOwnerIdOrderByIdDesc(@Param("ownerId") Long ownerId);

    // Lấy bài viết trong một nhóm cụ thể (lọc bài đã bị ẩn)
    @Query("SELECT p FROM Post p WHERE p.groupId = :groupId AND COALESCE(p.isHidden, false) = false ORDER BY p.id DESC")
    List<Post> findByGroupIdOrderByIdDesc(@Param("groupId") Long groupId);

    // Tìm kiếm bài viết theo title hoặc content (case-insensitive, chỉ bài không thuộc nhóm và không bị ẩn)
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND COALESCE(p.isHidden, false) = false AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY p.id DESC")
    Page<Post> searchByTitleOrContent(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND COALESCE(p.isHidden, false) = false AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY p.id DESC")
    List<Post> searchByTitleOrContent(@Param("query") String query);

    // Admin query: xem cả bài đang hiện lẫn bài đã ẩn
    @Query("""
        SELECT p FROM Post p
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:hidden IS NULL OR COALESCE(p.isHidden, false) = :hidden)
        ORDER BY p.id DESC
    """)
    Page<Post> adminSearchPosts(@Param("q") String q, @Param("hidden") Boolean hidden, Pageable pageable);

    long countByOwnerId(Long ownerId);

    long countByCreatedAtAfter(java.time.LocalDateTime since);

    @Query(value = """
        SELECT CAST(created_at AS DATE) AS day, COUNT(*) AS cnt
        FROM posts
        WHERE created_at >= :since
        GROUP BY CAST(created_at AS DATE)
        ORDER BY day ASC
    """, nativeQuery = true)
    List<Object[]> countDailyNewPosts(@Param("since") java.time.LocalDateTime since);
}
