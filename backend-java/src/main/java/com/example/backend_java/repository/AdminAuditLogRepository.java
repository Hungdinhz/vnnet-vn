package com.example.backend_java.repository;

import com.example.backend_java.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    @Query("""
        SELECT a FROM AdminAuditLog a
        WHERE (:actorId IS NULL OR a.actorId = :actorId)
          AND (:action IS NULL OR a.action = :action)
          AND (:targetType IS NULL OR a.targetType = :targetType)
        ORDER BY a.createdAt DESC
    """)
    Page<AdminAuditLog> findFiltered(@Param("actorId") Long actorId,
                                     @Param("action") String action,
                                     @Param("targetType") String targetType,
                                     Pageable pageable);
}
