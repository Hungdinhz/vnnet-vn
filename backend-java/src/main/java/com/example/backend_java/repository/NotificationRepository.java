package com.example.backend_java.repository;

import com.example.backend_java.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Lấy danh sách thông báo theo người nhận, sắp xếp mới nhất trước
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // Tìm thông báo theo id và recipient
    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);
}
