package com.example.backend_java.repository;

import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRole(Role role);

    long countByAccountStatus(AccountStatus status);

    long countByCreatedAtAfter(LocalDateTime since);

    List<User> findAllByAccountStatus(AccountStatus status);

    @Query("""
        SELECT u FROM User u
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:role IS NULL OR u.role = :role)
          AND (:status IS NULL OR u.accountStatus = :status)
          AND (:isVerified IS NULL OR u.isVerified = :isVerified)
          AND (:isGuest IS NULL OR u.isGuest = :isGuest)
        ORDER BY u.id DESC
    """)
    Page<User> adminSearchUsers(@Param("q") String q,
                                @Param("role") Role role,
                                @Param("status") AccountStatus status,
                                @Param("isVerified") Boolean isVerified,
                                @Param("isGuest") Boolean isGuest,
                                Pageable pageable);

    @Query(value = """
        SELECT CAST(created_at AS DATE) AS day, COUNT(*) AS cnt
        FROM users
        WHERE created_at >= :since
        GROUP BY CAST(created_at AS DATE)
        ORDER BY day ASC
    """, nativeQuery = true)
    List<Object[]> countDailyNewUsers(@Param("since") LocalDateTime since);

    // Tìm kiếm user theo username hoặc fullName (không lộ tìm kiếm theo email riêng tư)
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\' " +
           "OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\'")
    Page<User> searchByUsernameOrEmail(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\' " +
           "OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\'")
    List<User> searchByUsernameOrEmail(@Param("query") String query);
}
