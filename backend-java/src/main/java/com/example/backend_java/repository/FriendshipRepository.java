package com.example.backend_java.repository;

import com.example.backend_java.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Kiểm tra đã có lời mời hoặc đã là bạn chưa (cả 2 chiều)
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.userId = :userId AND f.friendId = :friendId) OR " +
           "(f.userId = :friendId AND f.friendId = :userId)")
    Optional<Friendship> findExistingFriendship(@Param("userId") Long userId, @Param("friendId") Long friendId);

    // Lấy danh sách bạn bè (status = accepted, cả 2 chiều)
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.userId = :userId OR f.friendId = :userId) AND f.status = 'accepted'")
    List<Friendship> findAcceptedFriendships(@Param("userId") Long userId);

    // Lấy lời mời đang chờ mà user hiện tại là người nhận
    List<Friendship> findByFriendIdAndStatus(Long friendId, String status);
}
