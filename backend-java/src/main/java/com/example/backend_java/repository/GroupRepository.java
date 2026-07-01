package com.example.backend_java.repository;

import com.example.backend_java.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    @Query("SELECT g FROM Group g WHERE g.name ILIKE %:keyword% OR g.description ILIKE %:keyword%")
    List<Group> searchGroups(String keyword);

    // Find groups the user has not joined
    @Query("SELECT g FROM Group g WHERE g.id NOT IN (SELECT gm.groupId FROM GroupMember gm WHERE gm.userId = :userId)")
    List<Group> findSuggestedGroups(Long userId);
}
