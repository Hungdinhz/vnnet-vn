package com.example.backend_java.repository;

import com.example.backend_java.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    List<UserBlock> findByBlockerIdOrderByCreatedAtDesc(Long blockerId);

    @Query("SELECT COUNT(b) > 0 FROM UserBlock b WHERE " +
           "(b.blocker.id = :u1 AND b.blocked.id = :u2) OR " +
           "(b.blocker.id = :u2 AND b.blocked.id = :u1)")
    boolean isBlockedEither(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT CASE WHEN b.blocker.id = :userId THEN b.blocked.id ELSE b.blocker.id END " +
           "FROM UserBlock b WHERE b.blocker.id = :userId OR b.blocked.id = :userId")
    Set<Long> findAllBlockedRelatedUserIds(@Param("userId") Long userId);

    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :userId")
    Set<Long> findBlockedUserIdsByBlocker(@Param("userId") Long userId);

    @Query("SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :userId")
    Set<Long> findBlockerUserIdsByBlocked(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserBlock b WHERE b.blocker.id = :blockerId AND b.blocked.id = :blockedId")
    void deleteByBlockerIdAndBlockedId(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);
}
