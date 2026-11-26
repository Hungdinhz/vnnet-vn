package com.example.backend_java.service.admin;

import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Notification;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.NotificationRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAnnouncementService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Async("taskExecutor")
    public void dispatchSystemNotification(Long senderId, Long targetUserId) {
        if (targetUserId != null) {
            notificationRepository.save(Notification.builder()
                    .recipientId(targetUserId)
                    .senderId(senderId)
                    .type("system_announcement")
                    .isRead(false)
                    .build());
            return;
        }

        List<User> activeUsers = userRepository.findAllByAccountStatus(AccountStatus.ACTIVE);
        List<Notification> batch = new ArrayList<>();
        for (User u : activeUsers) {
            if (u.getId().equals(senderId)) continue;
            batch.add(Notification.builder()
                    .recipientId(u.getId())
                    .senderId(senderId)
                    .type("system_announcement")
                    .isRead(false)
                    .build());
            if (batch.size() >= 200) {
                notificationRepository.saveAll(batch);
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            notificationRepository.saveAll(batch);
        }
        log.info("Đã phát thông báo hệ thống tới {} người dùng ACTIVE.", activeUsers.size());
    }
}
