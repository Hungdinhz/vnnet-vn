package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "friendships", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "friend_id"}, name = "_user_friend_uc")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người gửi lời mời
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Người nhận lời mời
    @Column(name = "friend_id", nullable = false)
    private Long friendId;

    // Trạng thái: pending / accepted
    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "pending";
}
