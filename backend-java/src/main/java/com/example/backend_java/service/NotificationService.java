package com.example.backend_java.service;

import com.example.backend_java.dto.NotificationResponseDto;
import com.example.backend_java.entity.Notification;
import com.example.backend_java.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // Tạo thông báo - tương đương crud_notif.create_notification
    public void createNotification(Long recipientId, Long senderId, String type, Long targetId) {
        // Tránh tự thông báo cho chính mình hoặc lỗi truyền ID null
        if (recipientId == null || senderId == null || recipientId.equals(senderId)) {
            return;
        }

        // Với thông báo tin nhắn: nếu đã có thông báo chưa đọc từ cùng hội thoại, chỉ cập nhật thời gian
        if ("message".equals(type) && targetId != null) {
            java.util.Optional<Notification> existingOpt = notificationRepository
                    .findFirstByRecipientIdAndTypeAndTargetIdAndIsReadFalse(recipientId, "message", targetId);
            if (existingOpt.isPresent()) {
                Notification existing = existingOpt.get();
                existing.setCreatedAt(java.time.LocalDateTime.now());
                existing.setSenderId(senderId);
                notificationRepository.save(existing);
                return;
            }
        }

        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(type)
                .targetId(targetId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    // Lấy danh sách thông báo - tương đương crud_notif.get_user_notifications
    public List<NotificationResponseDto> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    // Đánh dấu đã đọc - tương đương crud_notif.mark_as_read
    public NotificationResponseDto markAsRead(Long notifId, Long userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notifId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông báo hoặc bạn không có quyền"));

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        return toResponseDto(notification);
    }

    private NotificationResponseDto toResponseDto(Notification notification) {
        return NotificationResponseDto.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .senderId(notification.getSenderId())
                .type(notification.getType())
                .targetId(notification.getTargetId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
