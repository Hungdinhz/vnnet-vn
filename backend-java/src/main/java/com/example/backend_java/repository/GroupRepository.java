package com.example.backend_java.repository;

import com.example.backend_java.entity.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("SELECT g FROM Group g WHERE COALESCE(g.isHidden, false) = false AND (g.name ILIKE %:keyword% OR g.description ILIKE %:keyword%)")
    List<Group> searchGroups(String keyword);

    // Find groups the user has not joined (exclude hidden groups)
    @Query("SELECT g FROM Group g WHERE COALESCE(g.isHidden, false) = false AND g.id NOT IN (SELECT gm.groupId FROM GroupMember gm WHERE gm.userId = :userId)")
    List<Group> findSuggestedGroups(Long userId);

    @Query("""
        SELECT g FROM Group g
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(g.name) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(g.description, '')) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:hidden IS NULL OR COALESCE(g.isHidden, false) = :hidden)
        ORDER BY g.id DESC
    """)
    Page<Group> adminSearchGroups(@Param("q") String q, @Param("hidden") Boolean hidden, Pageable pageable);
}
