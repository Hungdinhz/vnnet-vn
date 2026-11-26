package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_match_players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameMatchPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private GameMatch match;

    @Column(name = "user_id")
    private Long userId; // null if Bot AI

    @Column(name = "is_bot", nullable = false)
    @Builder.Default
    private Boolean isBot = false;

    @Column(name = "display_name", length = 100, nullable = false)
    private String displayName;

    @Column(name = "seat_index", nullable = false)
    @Builder.Default
    private Integer seatIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer score = 0;

    @Column(name = "elo_before", nullable = false)
    @Builder.Default
    private Integer eloBefore = 1000;

    @Column(name = "elo_after", nullable = false)
    @Builder.Default
    private Integer eloAfter = 1000;

    @Column(length = 16, nullable = false)
    @Builder.Default
    private String result = "DRAW"; // WIN, LOSS, DRAW
}
