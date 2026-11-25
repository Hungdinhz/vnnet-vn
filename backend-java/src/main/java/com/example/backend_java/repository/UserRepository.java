package com.example.backend_java.repository;

import com.example.backend_java.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    // Tìm kiếm user theo username hoặc fullName (không lộ tìm kiếm theo email riêng tư)
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\' " +
           "OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\'")
    Page<User> searchByUsernameOrEmail(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\' " +
           "OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\'")
    List<User> searchByUsernameOrEmail(@Param("query") String query);
}
