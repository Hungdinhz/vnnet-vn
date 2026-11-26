package com.example.backend_java.service.admin;

import com.example.backend_java.dto.admin.AdminAuditLogDto;
import com.example.backend_java.entity.AdminAuditLog;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.AdminAuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditService {

    private final AdminAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void record(User actor,
                       String action,
                       String targetType,
                       Long targetId,
                       String reason,
                       Map<String, Object> metadata) {
        if (actor == null) {
            return;
        }
        String ipAddress = null;
        String userAgent = null;
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String xff = req.getHeader("X-Forwarded-For");
                ipAddress = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
                String ua = req.getHeader("User-Agent");
                userAgent = (ua != null && ua.length() > 255) ? ua.substring(0, 255) : ua;
            }
        } catch (Exception ignored) {
            // Không chặn nghiệp vụ nếu chạy ngoài HTTP request context (ví dụ unit test)
        }

        String metadataJson = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (Exception e) {
                log.warn("Không thể serialize metadata audit log: {}", e.getMessage());
            }
        }

        AdminAuditLog entry = AdminAuditLog.builder()
                .actorId(actor.getId())
                .actorEmail(actor.getEmail())
                .actorRole(actor.getEffectiveRole().name())
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .metadataJson(metadataJson)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(entry);
    }

    public Page<AdminAuditLogDto> listLogs(User currentAdmin,
                                           Long actorIdFilter,
                                           String action,
                                           String targetType,
                                           int page,
                                           int size) {
        // MODERATOR chỉ được xem audit log của chính mình
        Long effectiveActorId = currentAdmin.getEffectiveRole() == Role.MODERATOR
                ? currentAdmin.getId()
                : actorIdFilter;

        String normalizedAction = (action != null && !action.isBlank()) ? action.trim().toUpperCase() : null;
        String normalizedTarget = (targetType != null && !targetType.isBlank()) ? targetType.trim().toUpperCase() : null;

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        return auditLogRepository
                .findFiltered(effectiveActorId, normalizedAction, normalizedTarget, PageRequest.of(safePage, safeSize))
                .map(this::toDto);
    }

    private AdminAuditLogDto toDto(AdminAuditLog log) {
        return AdminAuditLogDto.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .actorEmail(log.getActorEmail())
                .actorRole(log.getActorRole())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .reason(log.getReason())
                .metadataJson(log.getMetadataJson())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
