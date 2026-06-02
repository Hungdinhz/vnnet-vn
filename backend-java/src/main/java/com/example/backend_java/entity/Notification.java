package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người nhận thông báo
    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    // Người gây ra hành động
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    // Loại thông báo: 'like', 'comment', 'friend_request'
    @Column(length = 50, nullable = false)
    private String type;

    // ID của đối tượng liên quan (ví dụ: id bài viết bị like)
    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
