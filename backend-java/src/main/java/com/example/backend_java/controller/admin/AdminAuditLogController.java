package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminAuditLogDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AdminAuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<AdminAuditLogDto> listAuditLogs(
            @AuthenticationPrincipal User currentAdmin,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return auditService.listLogs(currentAdmin, actorId, action, targetType, page, size);
    }
}
