package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.BroadcastAnnouncementRequest;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminAnnouncementService;
import com.example.backend_java.service.admin.AdminAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/announcements")
@RequiredArgsConstructor
public class AdminAnnouncementController {

    private final AdminAnnouncementService announcementService;
    private final AdminAuditService auditService;

    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public MessageDto broadcast(@AuthenticationPrincipal User currentAdmin,
                                @Valid @RequestBody BroadcastAnnouncementRequest req) {
        announcementService.dispatchSystemNotification(currentAdmin.getId(), req.getTargetUserId());
        auditService.record(
                currentAdmin,
                req.getTargetUserId() == null ? "SYSTEM_BROADCAST" : "USER_DIRECT_ANNOUNCEMENT",
                req.getTargetUserId() == null ? "SYSTEM" : "USER",
                req.getTargetUserId(),
                req.getMessage(),
                Map.of("target_user_id", req.getTargetUserId() != null ? req.getTargetUserId() : "ALL_ACTIVE")
        );
        return new MessageDto(req.getTargetUserId() == null
                ? "Đã đưa thông báo toàn hệ thống vào hàng đợi gửi bất đồng bộ."
                : "Đã gửi thông báo trực tiếp tới người dùng #" + req.getTargetUserId());
    }
}
