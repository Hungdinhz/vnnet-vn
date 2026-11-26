package com.example.backend_java.service.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.ReportItemDto;
import com.example.backend_java.dto.admin.AdminModerationDtos.ResolveReportRequest;
import com.example.backend_java.dto.admin.AdminUserDtos.UpdateUserStatusRequest;
import com.example.backend_java.entity.*;
import com.example.backend_java.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminReportService {

    private final ContentReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final GroupRepository groupRepository;
    private final MarketplaceItemRepository marketplaceRepository;
    private final NotificationRepository notificationRepository;
    private final AdminUserService adminUserService;
    private final AdminAuditService auditService;

    public Page<ReportItemDto> listReports(String statusStr, String targetTypeStr, int page, int size) {
        ContentReport.Status status = parseEnumOrNull(statusStr, ContentReport.Status.class);
        ContentReport.TargetType targetType = parseEnumOrNull(targetTypeStr, ContentReport.TargetType.class);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        return reportRepository.findFiltered(status, targetType, PageRequest.of(safePage, safeSize))
                .map(this::toDto);
    }

    @Transactional
    public ReportItemDto resolveReport(User actor, Long reportId, ResolveReportRequest req) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo #" + reportId));

        String action = req.getAction().trim().toUpperCase();
        String note = req.getResolutionNote() != null ? req.getResolutionNote().trim() : "";

        ContentReport.Status finalStatus = ContentReport.Status.RESOLVED;
        Long targetOwnerId = resolveOwnerId(report.getTargetType(), report.getTargetId());

        switch (action) {
            case "DISMISS" -> finalStatus = ContentReport.Status.DISMISSED;
            case "HIDE_CONTENT" -> hideTargetContent(actor, report.getTargetType(), report.getTargetId(),
                    note.isBlank() ? "Vi phạm tiêu chuẩn cộng đồng" : note);
            case "DELETE_CONTENT" -> {
                if (actor.getEffectiveRole() == Role.MODERATOR) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kiểm duyệt viên chỉ được ẩn nội dung, không được xóa vĩnh viễn.");
                }
                deleteTargetContent(report.getTargetType(), report.getTargetId());
            }
            case "WARN_USER" -> {
                if (targetOwnerId != null) {
                    notificationRepository.save(Notification.builder()
                            .recipientId(targetOwnerId)
                            .senderId(actor.getId())
                            .type("system_warning")
                            .targetId(report.getTargetId())
                            .isRead(false)
                            .build());
                }
            }
            case "SUSPEND_USER" -> {
                if (targetOwnerId == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không xác định được chủ sở hữu để tạm khóa.");
                }
                adminUserService.updateUserStatus(actor, targetOwnerId,
                        new UpdateUserStatusRequest("SUSPENDED",
                                req.getSuspendHours() != null ? req.getSuspendHours() : 24,
                                note.isBlank() ? "Vi phạm quy định cộng đồng (từ báo cáo #" + reportId + ")" : note));
            }
            case "BAN_USER" -> {
                if (targetOwnerId == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không xác định được chủ sở hữu để khóa vĩnh viễn.");
                }
                adminUserService.updateUserStatus(actor, targetOwnerId,
                        new UpdateUserStatusRequest("BANNED", null,
                                note.isBlank() ? "Vi phạm nghiêm trọng (từ báo cáo #" + reportId + ")" : note));
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hành động không hợp lệ: " + action);
        }

        LocalDateTime now = LocalDateTime.now();
        // Đóng report hiện tại và toàn bộ report trùng đang PENDING của cùng đối tượng
        List<ContentReport> siblingReports = reportRepository.findAllByTargetTypeAndTargetIdAndStatus(
                report.getTargetType(), report.getTargetId(), ContentReport.Status.PENDING);
        if (siblingReports.stream().noneMatch(r -> r.getId().equals(report.getId()))) {
            siblingReports.add(report);
        }
        for (ContentReport r : siblingReports) {
            r.setStatus(finalStatus);
            r.setHandledBy(actor.getId());
            r.setActionTaken(action);
            r.setResolutionNote(note);
            r.setResolvedAt(now);
        }
        reportRepository.saveAll(siblingReports);

        auditService.record(actor, "REPORT_" + action, report.getTargetType().name(), report.getTargetId(), note,
                Map.of("report_id", report.getId(), "closed_duplicates", siblingReports.size()));

        return toDto(report);
    }

    private void hideTargetContent(User actor, ContentReport.TargetType type, Long targetId, String reason) {
        LocalDateTime now = LocalDateTime.now();
        switch (type) {
            case POST -> postRepository.findById(targetId).ifPresent(p -> {
                p.setIsHidden(true);
                p.setHiddenReason(reason);
                p.setHiddenAt(now);
                p.setHiddenBy(actor.getId());
                postRepository.save(p);
            });
            case COMMENT -> commentRepository.findById(targetId).ifPresent(c -> {
                c.setIsHidden(true);
                c.setHiddenReason(reason);
                c.setHiddenAt(now);
                c.setHiddenBy(actor.getId());
                commentRepository.save(c);
            });
            case GROUP -> groupRepository.findById(targetId).ifPresent(g -> {
                g.setIsHidden(true);
                g.setHiddenReason(reason);
                g.setHiddenAt(now);
                g.setHiddenBy(actor.getId());
                groupRepository.save(g);
            });
            case MARKETPLACE_ITEM -> marketplaceRepository.findById(targetId).ifPresent(m -> {
                m.setIsHidden(true);
                m.setStatus("hidden");
                m.setHiddenReason(reason);
                m.setHiddenAt(now);
                m.setHiddenBy(actor.getId());
                marketplaceRepository.save(m);
            });
            case USER -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy dùng hành động WARN_USER / SUSPEND_USER / BAN_USER cho đối tượng USER.");
        }
    }

    private void deleteTargetContent(ContentReport.TargetType type, Long targetId) {
        switch (type) {
            case POST -> postRepository.deleteById(targetId);
            case COMMENT -> commentRepository.deleteById(targetId);
            case GROUP -> groupRepository.deleteById(targetId);
            case MARKETPLACE_ITEM -> marketplaceRepository.deleteById(targetId);
            case USER -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không xóa cứng tài khoản người dùng qua report; hãy dùng BAN_USER.");
        }
    }

    private Long resolveOwnerId(ContentReport.TargetType type, Long targetId) {
        return switch (type) {
            case USER -> targetId;
            case POST -> postRepository.findById(targetId).map(Post::getOwnerId).orElse(null);
            case COMMENT -> commentRepository.findById(targetId).map(Comment::getUserId).orElse(null);
            case GROUP -> groupRepository.findById(targetId).map(Group::getCreatorId).orElse(null);
            case MARKETPLACE_ITEM -> marketplaceRepository.findById(targetId).map(MarketplaceItem::getSellerId).orElse(null);
        };
    }

    private String resolveTargetPreview(ContentReport.TargetType type, Long targetId) {
        return switch (type) {
            case USER -> userRepository.findById(targetId)
                    .map(u -> "@" + u.getUsername() + " (" + u.getEmail() + ")")
                    .orElse("[Người dùng đã xóa #" + targetId + "]");
            case POST -> postRepository.findById(targetId)
                    .map(p -> truncate(p.getTitle() + " — " + p.getContent(), 120))
                    .orElse("[Bài viết đã xóa #" + targetId + "]");
            case COMMENT -> commentRepository.findById(targetId)
                    .map(c -> truncate(c.getContent(), 120))
                    .orElse("[Bình luận đã xóa #" + targetId + "]");
            case GROUP -> groupRepository.findById(targetId)
                    .map(g -> "Nhóm: " + g.getName())
                    .orElse("[Nhóm đã xóa #" + targetId + "]");
            case MARKETPLACE_ITEM -> marketplaceRepository.findById(targetId)
                    .map(m -> "Tin chợ: " + m.getTitle())
                    .orElse("[Tin chợ đã xóa #" + targetId + "]");
        };
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private <E extends Enum<E>> E parseEnumOrNull(String value, Class<E> enumClass) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị lọc không hợp lệ: " + value);
        }
    }

    private ReportItemDto toDto(ContentReport r) {
        String reporterUsername = userRepository.findById(r.getReporterId())
                .map(User::getUsername).orElse("unknown");
        return ReportItemDto.builder()
                .id(r.getId())
                .reporterId(r.getReporterId())
                .reporterUsername(reporterUsername)
                .targetType(r.getTargetType().name())
                .targetId(r.getTargetId())
                .targetPreview(resolveTargetPreview(r.getTargetType(), r.getTargetId()))
                .reasonCategory(r.getReasonCategory().name())
                .description(r.getDescription())
                .status(r.getStatus().name())
                .handledBy(r.getHandledBy())
                .resolutionNote(r.getResolutionNote())
                .actionTaken(r.getActionTaken())
                .createdAt(r.getCreatedAt())
                .resolvedAt(r.getResolvedAt())
                .build();
    }
}
