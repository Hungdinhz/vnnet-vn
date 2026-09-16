package com.example.backend_java.repository;

import com.example.backend_java.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByIsActiveTrueOrderByPlayCountDesc();

    List<Game> findByCategoryAndIsActiveTrueOrderByPlayCountDesc(String category);

    @Query("SELECT g FROM Game g WHERE g.isActive = true AND " +
           "LOWER(g.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY g.playCount DESC")
    List<Game> searchByTitle(@Param("keyword") String keyword);
}
