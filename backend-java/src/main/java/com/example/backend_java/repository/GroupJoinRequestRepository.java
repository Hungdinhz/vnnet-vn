package com.example.backend_java.repository;

import com.example.backend_java.entity.GroupJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupJoinRequestRepository extends JpaRepository<GroupJoinRequest, Long> {
    Optional<GroupJoinRequest> findByGroupIdAndUserId(Long groupId, Long userId);
    List<GroupJoinRequest> findByGroupIdAndStatusOrderByCreatedAtDesc(Long groupId, String status);
    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, String status);
    void deleteByGroupIdAndUserId(Long groupId, Long userId);
    void deleteByGroupId(Long groupId);
    int countByGroupIdAndStatus(Long groupId, String status);
}
