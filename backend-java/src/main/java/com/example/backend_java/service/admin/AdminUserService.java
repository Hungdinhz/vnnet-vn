package com.example.backend_java.service.admin;

import com.example.backend_java.dto.admin.AdminUserDtos.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final AdminAuditService auditService;

    public Page<AdminUserSummaryDto> searchUsers(String q,
                                                 String roleStr,
                                                 String statusStr,
                                                 Boolean isVerified,
                                                 Boolean isGuest,
                                                 int page,
                                                 int size) {
        Role role = parseEnumOrNull(roleStr, Role.class);
        AccountStatus status = parseEnumOrNull(statusStr, AccountStatus.class);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        String query = (q != null && !q.isBlank()) ? q.trim() : null;

        return userRepository
                .adminSearchUsers(query, role, status, isVerified, isGuest, PageRequest.of(safePage, safeSize))
                .map(this::toSummaryDto);
    }

    public AdminUserSummaryDto getUserDetail(Long userId) {
        User target = findUserOrThrow(userId);
        return toSummaryDto(target);
    }

    @Transactional
    public AdminUserSummaryDto updateUserStatus(User actor, Long targetUserId, UpdateUserStatusRequest req) {
        User target = findUserOrThrow(targetUserId);
        AccountStatus newStatus = parseEnumOrThrow(req.getStatus(), AccountStatus.class, "Trạng thái không hợp lệ");

        // Safety invariant 1: Không được tự thay đổi trạng thái chính mình
        if (actor.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự thay đổi trạng thái tài khoản của chính mình.");
        }

        // Safety invariant 2: Không được tác động lên người có cấp bậc bằng hoặc cao hơn
        if (target.getEffectiveRole().rank() >= actor.getEffectiveRole().rank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thay đổi trạng thái của tài khoản có cấp bậc ngang hoặc cao hơn.");
        }

        // Safety invariant 3: MODERATOR không được phép BAN vĩnh viễn
        if (newStatus == AccountStatus.BANNED && actor.getEffectiveRole() == Role.MODERATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kiểm duyệt viên chỉ được tạm khóa (SUSPENDED), không được khóa vĩnh viễn (BANNED).");
        }

        // Safety invariant 4: Không được khóa SUPER_ADMIN cuối cùng
        if (target.getEffectiveRole() == Role.SUPER_ADMIN && newStatus != AccountStatus.ACTIVE
                && userRepository.countByRole(Role.SUPER_ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể khóa SUPER_ADMIN cuối cùng trong hệ thống.");
        }

        AccountStatus previousStatus = target.getEffectiveAccountStatus();
        String reason = req.getReason() != null ? req.getReason().trim() : null;

        if ((newStatus == AccountStatus.SUSPENDED || newStatus == AccountStatus.BANNED)
                && (reason == null || reason.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do khi khóa tài khoản.");
        }

        target.setAccountStatus(newStatus);
        if (newStatus == AccountStatus.ACTIVE) {
            target.setBannedUntil(null);
            target.setBanReason(null);
        } else if (newStatus == AccountStatus.SUSPENDED) {
            int hours = (req.getDurationHours() != null && req.getDurationHours() > 0) ? req.getDurationHours() : 24;
            target.setBannedUntil(LocalDateTime.now().plusHours(hours));
            target.setBanReason(reason);
            bumpTokenVersion(target);
        } else if (newStatus == AccountStatus.BANNED) {
            target.setBannedUntil(null);
            target.setBanReason(reason);
            bumpTokenVersion(target);
        }

        userRepository.save(target);

        Map<String, Object> meta = new HashMap<>();
        meta.put("previous_status", previousStatus.name());
        meta.put("new_status", newStatus.name());
        if (target.getBannedUntil() != null) {
            meta.put("banned_until", target.getBannedUntil().toString());
        }
        auditService.record(actor, "USER_STATUS_" + newStatus.name(), "USER", target.getId(), reason, meta);

        return toSummaryDto(target);
    }

    @Transactional
    public MessageDto forceLogout(User actor, Long targetUserId, String reason) {
        User target = findUserOrThrow(targetUserId);
        if (actor.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng dùng chức năng đăng xuất cho phiên của chính bạn.");
        }
        if (target.getEffectiveRole().rank() >= actor.getEffectiveRole().rank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thu hồi phiên của tài khoản này.");
        }

        bumpTokenVersion(target);
        userRepository.save(target);

        auditService.record(actor, "USER_FORCE_LOGOUT", "USER", target.getId(), reason,
                Map.of("new_token_version", target.getTokenVersion()));
        return new MessageDto("Đã thu hồi toàn bộ phiên đăng nhập của người dùng @" + target.getUsername());
    }

    @Transactional
    public AdminUserSummaryDto updateVerification(User actor, Long targetUserId, UpdateUserVerifyRequest req) {
        User target = findUserOrThrow(targetUserId);
        boolean previous = Boolean.TRUE.equals(target.getIsVerified());
        target.setIsVerified(Boolean.TRUE.equals(req.getIsVerified()));
        userRepository.save(target);

        auditService.record(actor, "USER_VERIFY_UPDATED", "USER", target.getId(), req.getReason(),
                Map.of("previous_verified", previous, "new_verified", target.getIsVerified()));
        return toSummaryDto(target);
    }

    @Transactional
    public AdminUserSummaryDto updateUserRole(User actor, Long targetUserId, UpdateUserRoleRequest req) {
        if (actor.getEffectiveRole() != Role.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ SUPER_ADMIN mới có quyền thay đổi vai trò.");
        }

        User target = findUserOrThrow(targetUserId);
        Role newRole = parseEnumOrThrow(req.getRole(), Role.class, "Vai trò không hợp lệ");
        Role previousRole = target.getEffectiveRole();

        if (actor.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự thay đổi vai trò của chính mình.");
        }

        if (previousRole == Role.SUPER_ADMIN && newRole != Role.SUPER_ADMIN
                && userRepository.countByRole(Role.SUPER_ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể hạ quyền SUPER_ADMIN cuối cùng trong hệ thống.");
        }

        if (newRole.isStaff() && (!Boolean.TRUE.equals(target.getIsVerified()) || Boolean.TRUE.equals(target.getIsGuest()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể cấp quyền quản trị cho tài khoản đã xác minh email (không phải tài khoản khách).");
        }

        target.setRole(newRole);
        bumpTokenVersion(target);
        userRepository.save(target);

        auditService.record(actor, "USER_ROLE_CHANGED", "USER", target.getId(), req.getReason(),
                Map.of("previous_role", previousRole.name(), "new_role", newRole.name()));
        return toSummaryDto(target);
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng #" + userId));
    }

    private void bumpTokenVersion(User user) {
        int current = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        user.setTokenVersion(current + 1);
    }

    private <E extends Enum<E>> E parseEnumOrNull(String value, Class<E> enumClass) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị lọc không hợp lệ: " + value);
        }
    }

    private <E extends Enum<E>> E parseEnumOrThrow(String value, Class<E> enumClass, String errorMsg) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMsg);
        }
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMsg + ": " + value);
        }
    }

    private AdminUserSummaryDto toSummaryDto(User u) {
        return AdminUserSummaryDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .role(u.getEffectiveRole().name())
                .accountStatus(u.getEffectiveAccountStatus().name())
                .bannedUntil(u.getBannedUntil())
                .banReason(u.getBanReason())
                .isVerified(u.getIsVerified())
                .isGuest(u.getIsGuest())
                .isPrivate(u.getIsPrivate())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .postsCount(postRepository.countByOwnerId(u.getId()))
                .build();
    }
}
