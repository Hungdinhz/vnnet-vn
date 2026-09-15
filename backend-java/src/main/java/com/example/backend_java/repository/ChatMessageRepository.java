package com.example.backend_java.repository;

import com.example.backend_java.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    Optional<ChatMessage> findTop1ByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.id = :conversationId AND m.createdAt > :lastReadAt AND m.sender.id != :userId")
    Long countUnreadInConversation(@Param("conversationId") Long conversationId, 
                                   @Param("userId") Long userId, 
                                   @Param("lastReadAt") LocalDateTime lastReadAt);

    // Legacy queries for backward compatibility
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
