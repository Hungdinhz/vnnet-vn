package com.example.backend_java.repository;

import com.example.backend_java.entity.ContentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
            Long reporterId,
            ContentReport.TargetType targetType,
            Long targetId,
            ContentReport.Status status
    );

    long countByStatus(ContentReport.Status status);

    List<ContentReport> findAllByTargetTypeAndTargetIdAndStatus(
            ContentReport.TargetType targetType,
            Long targetId,
            ContentReport.Status status
    );

    @Query("""
        SELECT r FROM ContentReport r
        WHERE (:status IS NULL OR r.status = :status)
          AND (:targetType IS NULL OR r.targetType = :targetType)
        ORDER BY r.createdAt DESC
    """)
    Page<ContentReport> findFiltered(@Param("status") ContentReport.Status status,
                                     @Param("targetType") ContentReport.TargetType targetType,
                                     Pageable pageable);
}
