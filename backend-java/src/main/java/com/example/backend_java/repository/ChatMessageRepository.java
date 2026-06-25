package com.example.backend_java.repository;

import com.example.backend_java.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :user1Id AND m.receiver.id = :user2Id) OR (m.sender.id = :user2Id AND m.receiver.id = :user1Id) ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query(value = "SELECT * FROM messages m WHERE m.id IN (" +
            "SELECT MAX(m2.id) FROM messages m2 " +
            "WHERE m2.sender_id = :userId OR m2.receiver_id = :userId " +
            "GROUP BY LEAST(m2.sender_id, m2.receiver_id), GREATEST(m2.sender_id, m2.receiver_id)" +
            ") ORDER BY m.created_at DESC", nativeQuery = true)
    List<ChatMessage> findRecentConversations(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiver.id = :userId AND m.sender.id = :contactId AND m.isRead = false")
    Long countUnreadMessages(@Param("userId") Long userId, @Param("contactId") Long contactId);
    
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiver.id = :userId AND m.isRead = false")
    Long countAllUnreadMessages(@Param("userId") Long userId);
}
