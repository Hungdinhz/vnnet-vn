package com.example.backend_java.controller;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/games")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    /**
     * Lấy danh sách trò chơi (hỗ trợ filter theo category và keyword)
     */
    @GetMapping("")
    public ResponseEntity<List<GameResponseDto>> getGames(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long currentUserId = gameService.resolveCurrentUserId(authHeader);
        return ResponseEntity.ok(gameService.getAllGames(category, keyword, currentUserId));
    }

    /**
     * Chi tiết một trò chơi
     */
    @GetMapping("/{id}")
    public ResponseEntity<GameResponseDto> getGame(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long currentUserId = gameService.resolveCurrentUserId(authHeader);
        return ResponseEntity.ok(gameService.getGameById(id, currentUserId));
    }

    /**
     * Gửi điểm số sau khi hoàn thành lượt chơi (cần đăng nhập)
     */
    @PostMapping("/{id}/scores")
    public ResponseEntity<GameScoreResponseDto> submitScore(
            @PathVariable Long id,
            @Valid @RequestBody GameScoreCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(gameService.submitScore(id, currentUser, dto));
    }

    /**
     * Bảng xếp hạng điểm cao của một trò chơi
     */
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<PagedResponseDto<LeaderboardEntryDto>> getLeaderboard(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(gameService.getLeaderboard(id, page, size));
    }

    /**
     * Lịch sử điểm của user hiện tại cho trò chơi này
     */
    @GetMapping("/{id}/scores/me")
    public ResponseEntity<List<GameScoreResponseDto>> getMyScores(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(gameService.getUserScoresForGame(id, currentUser.getId()));
    }

    /**
     * Danh sách thành tựu của trò chơi
     */
    @GetMapping("/{id}/achievements")
    public ResponseEntity<List<GameAchievementDto>> getAchievements(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long currentUserId = gameService.resolveCurrentUserId(authHeader);
        return ResponseEntity.ok(gameService.getGameAchievements(id, currentUserId));
    }

    /**
     * Bảng xếp hạng điểm toàn cầu
     */
    @GetMapping("/leaderboard/global")
    public ResponseEntity<PagedResponseDto<LeaderboardEntryDto>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(gameService.getGlobalLeaderboard(page, size));
    }

    /**
     * Thống kê chơi game của user hiện tại
     */
    @GetMapping("/stats/me")
    public ResponseEntity<GameStatsDto> getMyStats(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(gameService.getUserStats(currentUser.getId()));
    }

    /**
     * Thống kê chơi game của một user bất kỳ
     */
    @GetMapping("/stats/{userId}")
    public ResponseEntity<GameStatsDto> getUserStats(@PathVariable Long userId) {
        return ResponseEntity.ok(gameService.getUserStats(userId));
    }
}
