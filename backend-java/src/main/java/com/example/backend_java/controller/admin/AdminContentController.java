package com.example.backend_java.controller.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.*;
import com.example.backend_java.dto.admin.AdminUserDtos.ReasonRequest;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.admin.AdminContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService contentService;

    // --- POSTS ---
    @GetMapping("/posts")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<AdminPostDto> searchPosts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean hidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return contentService.searchPosts(q, hidden, page, size);
    }

    @PatchMapping("/posts/{id}/hide")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminPostDto hidePost(@AuthenticationPrincipal User actor,
                                 @PathVariable Long id,
                                 @Valid @RequestBody HideContentRequest req) {
        return contentService.hidePost(actor, id, req.getReason());
    }

    @PatchMapping("/posts/{id}/restore")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminPostDto restorePost(@AuthenticationPrincipal User actor, @PathVariable Long id) {
        return contentService.restorePost(actor, id);
    }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public MessageDto deletePost(@AuthenticationPrincipal User actor,
                                 @PathVariable Long id,
                                 @RequestBody(required = false) ReasonRequest req) {
        String reason = req != null && req.getReason() != null ? req.getReason() : "Xóa bởi quản trị viên";
        return contentService.deletePost(actor, id, reason);
    }

    // --- GROUPS ---
    @GetMapping("/groups")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<AdminGroupDto> searchGroups(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean hidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return contentService.searchGroups(q, hidden, page, size);
    }

    @PatchMapping("/groups/{id}/hide")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminGroupDto hideGroup(@AuthenticationPrincipal User actor,
                                   @PathVariable Long id,
                                   @Valid @RequestBody HideContentRequest req) {
        return contentService.hideGroup(actor, id, req.getReason());
    }

    @PatchMapping("/groups/{id}/restore")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminGroupDto restoreGroup(@AuthenticationPrincipal User actor, @PathVariable Long id) {
        return contentService.restoreGroup(actor, id);
    }

    // --- MARKETPLACE ---
    @GetMapping("/marketplace")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public Page<AdminMarketplaceDto> searchMarketplace(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean hidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return contentService.searchMarketplace(q, hidden, page, size);
    }

    @PatchMapping("/marketplace/{id}/hide")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminMarketplaceDto hideMarketplace(@AuthenticationPrincipal User actor,
                                               @PathVariable Long id,
                                               @Valid @RequestBody HideContentRequest req) {
        return contentService.hideMarketplaceItem(actor, id, req.getReason());
    }

    @PatchMapping("/marketplace/{id}/restore")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public AdminMarketplaceDto restoreMarketplace(@AuthenticationPrincipal User actor, @PathVariable Long id) {
        return contentService.restoreMarketplaceItem(actor, id);
    }
}
