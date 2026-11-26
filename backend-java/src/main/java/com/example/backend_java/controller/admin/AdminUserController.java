package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminUserDtos.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<AdminUserSummaryDto> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isVerified,
            @RequestParam(required = false) Boolean isGuest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminUserService.searchUsers(q, role, status, isVerified, isGuest, page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminUserSummaryDto getUserDetail(@PathVariable Long id) {
        return adminUserService.getUserDetail(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminUserSummaryDto updateUserStatus(
            @AuthenticationPrincipal User currentAdmin,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        return adminUserService.updateUserStatus(currentAdmin, id, request);
    }

    @PostMapping("/{id}/force-logout")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public MessageDto forceLogout(
            @AuthenticationPrincipal User currentAdmin,
            @PathVariable Long id,
            @RequestBody(required = false) ReasonRequest request
    ) {
        String reason = request != null ? request.getReason() : "Admin force logout";
        return adminUserService.forceLogout(currentAdmin, id, reason);
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public AdminUserSummaryDto updateVerification(
            @AuthenticationPrincipal User currentAdmin,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserVerifyRequest request
    ) {
        return adminUserService.updateVerification(currentAdmin, id, request);
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public AdminUserSummaryDto updateUserRole(
            @AuthenticationPrincipal User currentAdmin,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return adminUserService.updateUserRole(currentAdmin, id, request);
    }
}
