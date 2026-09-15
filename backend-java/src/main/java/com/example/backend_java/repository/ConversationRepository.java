package com.example.backend_java.repository;

import com.example.backend_java.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c JOIN c.members m WHERE m.user.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c JOIN c.members m1 JOIN c.members m2 " +
           "WHERE c.type = com.example.backend_java.entity.ConversationType.DIRECT " +
           "AND m1.user.id = :userId1 AND m2.user.id = :userId2")
    List<Conversation> findDirectConversations(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
