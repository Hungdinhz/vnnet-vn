package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.ReportItemDto;
import com.example.backend_java.dto.admin.AdminModerationDtos.ResolveReportRequest;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<ReportItemDto> listReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminReportService.listReports(status, targetType, page, size);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ReportItemDto resolveReport(
            @AuthenticationPrincipal User currentAdmin,
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request
    ) {
        return adminReportService.resolveReport(currentAdmin, id, request);
    }
}
