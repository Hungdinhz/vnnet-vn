package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "game_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", nullable = false)
    private Long gameId;

    @Column(name = "room_code", length = 16, nullable = false)
    private String roomCode;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String mode = "PVP"; // PVP, BOT, RANKED

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "FINISHED"; // FINISHED, ABORTED

    @Column(name = "winner_id")
    private Long winnerId;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "total_moves", nullable = false)
    @Builder.Default
    private Integer totalMoves = 0;

    @Column(name = "end_reason", length = 40)
    private String endReason; // FIVE_IN_ROW, TIMEOUT, FORFEIT, DRAW, DISCONNECT

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GameMatchPlayer> players = new ArrayList<>();
}
