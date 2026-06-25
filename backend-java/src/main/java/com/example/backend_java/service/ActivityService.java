package com.example.backend_java.service;

import com.example.backend_java.dto.ActivityDataDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ActivityService {

    @PersistenceContext
    private EntityManager entityManager;

    public List<ActivityDataDto> getUserActivity(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(29); // 30 days including today

        // Count posts per day
        Map<String, Long> postsMap = countByDay(
                "SELECT CAST(p.created_at AS DATE), COUNT(*) FROM posts p WHERE p.owner_id = :userId AND p.created_at >= :startDate GROUP BY CAST(p.created_at AS DATE)",
                userId, startDate
        );

        // Count comments per day
        Map<String, Long> commentsMap = countByDay(
                "SELECT CAST(p.created_at AS DATE), COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.user_id = :userId AND p.created_at >= :startDate GROUP BY CAST(p.created_at AS DATE)",
                userId, startDate
        );

        // Count likes per day (using notifications as proxy since likes don't have timestamps)
        Map<String, Long> likesMap = countByDay(
                "SELECT CAST(n.created_at AS DATE), COUNT(*) FROM notifications n WHERE n.sender_id = :userId AND n.type = 'like' AND n.created_at >= :startDate GROUP BY CAST(n.created_at AS DATE)",
                userId, startDate
        );

        // Build result list for all 30 days
        List<ActivityDataDto> result = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            String key = date.format(fmt);
            result.add(ActivityDataDto.builder()
                    .date(key)
                    .posts(postsMap.getOrDefault(key, 0L))
                    .comments(commentsMap.getOrDefault(key, 0L))
                    .likes(likesMap.getOrDefault(key, 0L))
                    .build());
        }

        return result;
    }

    private Map<String, Long> countByDay(String sql, Long userId, LocalDate startDate) {
        Map<String, Long> map = new HashMap<>();
        try {
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter("userId", userId);
            query.setParameter("startDate", startDate.atStartOfDay());

            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            for (Object[] row : rows) {
                if (row[0] != null) {
                    String dateStr;
                    if (row[0] instanceof java.sql.Date) {
                        dateStr = ((java.sql.Date) row[0]).toLocalDate().format(fmt);
                    } else {
                        dateStr = row[0].toString().substring(0, 10);
                    }
                    Long count = ((Number) row[1]).longValue();
                    map.put(dateStr, count);
                }
            }
        } catch (Exception e) {
            // If query fails (e.g., table structure mismatch), return empty map
            System.err.println("Activity query error: " + e.getMessage());
        }
        return map;
    }
}
