package com.example.backend_java.controller;

import com.example.backend_java.dto.MessageDto;
import com.example.backend_java.dto.NotificationResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // GET /notifications - Lấy danh sách thông báo
    @GetMapping("")
    public ResponseEntity<List<NotificationResponseDto>> getNotifications(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.getId()));
    }

    // PUT /notifications/{notif_id}/read - Đánh dấu đã đọc
    @PutMapping("/{notifId}/read")
    public ResponseEntity<MessageDto> markAsRead(
            @PathVariable Long notifId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        notificationService.markAsRead(notifId, currentUser.getId());
        return ResponseEntity.ok(new MessageDto("Đã đánh dấu thông báo là đã đọc"));
    }
}
