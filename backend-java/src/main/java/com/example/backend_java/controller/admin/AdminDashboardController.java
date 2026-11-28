package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.DailyGrowthPoint;
import com.example.backend_java.dto.admin.AdminModerationDtos.DashboardGrowthDto;
import com.example.backend_java.dto.admin.AdminModerationDtos.DashboardOverviewDto;
import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.ContentReport;
import com.example.backend_java.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final GroupRepository groupRepository;
    private final MarketplaceItemRepository marketplaceRepository;
    private final ContentReportRepository reportRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public DashboardOverviewDto getOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last24h = now.minusHours(24);
        LocalDateTime last7d = now.minusDays(7);

        long restricted = userRepository.countByAccountStatus(AccountStatus.SUSPENDED)
                + userRepository.countByAccountStatus(AccountStatus.BANNED);

        return DashboardOverviewDto.builder()
                .totalUsers(userRepository.count())
                .activeUsers24h(userRepository.countActiveUsersSince(last24h))
                .newUsers24h(userRepository.countByCreatedAtAfter(last24h))
                .newUsers7d(userRepository.countByCreatedAtAfter(last7d))
                .restrictedUsers(restricted)
                .totalPosts(postRepository.count())
                .newPosts24h(postRepository.countByCreatedAtAfter(last24h))
                .totalGroups(groupRepository.count())
                .activeMarketplaceItems(marketplaceRepository.countByStatusAndIsHiddenFalse("active"))
                .pendingReports(reportRepository.countByStatus(ContentReport.Status.PENDING))
                .build();
    }

    @GetMapping("/growth")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public DashboardGrowthDto getGrowth(@RequestParam(defaultValue = "14") int days) {
        int safeDays = Math.min(Math.max(7, days), 90);
        LocalDate startDate = LocalDate.now().minusDays(safeDays - 1L);
        LocalDateTime since = startDate.atStartOfDay();

        Map<String, Long> activeUserMap = new HashMap<>();
        for (Object[] row : userRepository.countDailyActiveUsers(since)) {
            if (row[0] != null && row[1] != null) {
                activeUserMap.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }

        Map<String, Long> newUserMap = new HashMap<>();
        for (Object[] row : userRepository.countDailyNewUsers(since)) {
            if (row[0] != null && row[1] != null) {
                newUserMap.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }

        Map<String, Long> postMap = new HashMap<>();
        for (Object[] row : postRepository.countDailyNewPosts(since)) {
            if (row[0] != null && row[1] != null) {
                postMap.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }

        List<DailyGrowthPoint> points = new ArrayList<>();
        for (int i = 0; i < safeDays; i++) {
            String dayStr = startDate.plusDays(i).toString();
            points.add(DailyGrowthPoint.builder()
                    .date(dayStr)
                    .activeUsers(activeUserMap.getOrDefault(dayStr, 0L))
                    .newUsers(newUserMap.getOrDefault(dayStr, 0L))
                    .newPosts(postMap.getOrDefault(dayStr, 0L))
                    .build());
        }

        return DashboardGrowthDto.builder()
                .days(safeDays)
                .points(points)
                .build();
    }
}
